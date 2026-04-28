import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from '@react-native-firebase/firestore';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Supercluster, { ClusterFeature, PointFeature } from 'supercluster';
import PhonkText from '../../components/PhonkText';
import { logger } from '../../utils/logger';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import {
  DOHA_CENTER,
  haversineDistanceKm,
  isInQatar,
  isValidLatLng,
  LatLng,
  QATAR_BOUNDS,
  regionCacheKey,
  rememberRegionCacheKey,
  toGeohash
} from '../../utils/mapGeo';

function clampRegion(region: Region): Region {
  const minLatDelta = 0.05;
  const minLngDelta = 0.05;
  const maxLatDelta = 0.5;   // prevents zooming too far out
  const maxLngDelta = 0.5;
  const latDelta = Math.min(Math.max(region.latitudeDelta, minLatDelta), maxLatDelta);
  const lngDelta = Math.min(Math.max(region.longitudeDelta, minLngDelta), maxLngDelta);

  const halfLat = latDelta / 2;
  const halfLng = lngDelta / 2;

  let lat = region.latitude;
  let lng = region.longitude;

  if (lat - halfLat < QATAR_BOUNDS.minLatitude) lat = QATAR_BOUNDS.minLatitude + halfLat;
  if (lat + halfLat > QATAR_BOUNDS.maxLatitude) lat = QATAR_BOUNDS.maxLatitude - halfLat;
  if (lng - halfLng < QATAR_BOUNDS.minLongitude) lng = QATAR_BOUNDS.minLongitude + halfLng;
  if (lng + halfLng > QATAR_BOUNDS.maxLongitude) lng = QATAR_BOUNDS.maxLongitude - halfLng;

  return { latitude: lat, longitude: lng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAP_GEOHASH_PRECISION = 5;
const _DEFAULT_ZOOM = 11.5;
void _DEFAULT_ZOOM;

type VendorMapItem = {
  id: string;
  name?: string;
  nameAr?: string;
  address?: string;
  addressAr?: string;
  latitude: number;
  longitude: number;
  geohash: string;
  distanceKm?: number;
};

type RegionCachePayload = {
  fetchedAt: number;
  vendors: VendorMapItem[];
};


export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isArabic = i18n.language === 'ar';
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);
  const superclusterRef = useRef<Supercluster>(new Supercluster({ radius: 52, maxZoom: 14 }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorMapItem[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: DOHA_CENTER.latitude,
    longitude: DOHA_CENTER.longitude,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [_searchingNearby, setSearchingNearby] = useState(false);
  void _searchingNearby;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedVendorIds, setSearchedVendorIds] = useState<Set<string> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMapVendor, setSelectedMapVendor] = useState<VendorMapItem | null>(null);
  const [vendorDetail, setVendorDetail] = useState<any>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<{ lat: number; lng: number; vendorId: string } | null>(null);
  const pendingSelectVendorIdRef = useRef<string | null>(null);
  const params = useLocalSearchParams<{ vendorId?: string; lat?: string; lng?: string }>();

  useEffect(() => {
    let active = true;
    const trimmedQuery = searchQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      setSearchedVendorIds(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const db = getFirestore();
        const vendorsRef = collection(db, 'vendors');
        const q = query(vendorsRef, where('searchTokens', 'array-contains', trimmedQuery));
        const snapshot = await getDocs(q);

        if (!active) return;

        const ids = new Set<string>();
        snapshot.forEach((docSnap: any) => ids.add(docSnap.id));
        setSearchedVendorIds(ids);

        // Animate map to show results
        if (ids.size > 0) {
          const matchedCoords = vendors
            .filter((v) => ids.has(v.id))
            .map((v) => ({ latitude: v.latitude, longitude: v.longitude }));

          if (matchedCoords.length > 0) {
            mapRef.current?.fitToCoordinates(matchedCoords, {
              edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
              animated: true,
            });
          }
        }
      } catch (err) {
        logger.error('Error fetching vendors for map search:', err);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, vendors]);

  // In-memory vendor cache — accumulates across fetches so panning back is instant
  const vendorCacheRef = useRef<Map<string, VendorMapItem>>(new Map());
  const lastFetchedKeyRef = useRef<string | null>(null);
  const isClampingRef = useRef(false);
  const hasFetchedOnceRef = useRef(false);

  // Build GeoJSON points from vendors and load into supercluster
  const vendorPoints: PointFeature[] = useMemo(() => {
    let filteredVendors = vendors;
    if (searchedVendorIds) {
      filteredVendors = vendors.filter((v) => searchedVendorIds.has(v.id));
    }

    return filteredVendors.map((vendor) => ({
      type: 'Feature' as const,
      id: vendor.id,
      properties: {
        cluster: false,
        id: vendor.id,
        name: vendor.name,
        nameAr: vendor.nameAr,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [vendor.longitude, vendor.latitude] as [number, number],
      },
    }));
  }, [vendors, searchedVendorIds]);

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    const { longitudeDelta } = currentRegion;
    const safeLongitudeDelta =
      Number.isFinite(longitudeDelta) && longitudeDelta > 0 ? longitudeDelta : 0.05;
    const zoom = Math.max(0, Math.round(Math.log2(360 / safeLongitudeDelta)));
    const bounds: [number, number, number, number] = [
      currentRegion.longitude - currentRegion.longitudeDelta / 2,
      currentRegion.latitude - currentRegion.latitudeDelta / 2,
      currentRegion.longitude + currentRegion.longitudeDelta / 2,
      currentRegion.latitude + currentRegion.latitudeDelta / 2,
    ];

    // Load points before querying so supercluster has an initialized index.
    superclusterRef.current.load(vendorPoints);

    if (!vendorPoints.length) return [];
    return superclusterRef.current.getClusters(bounds, zoom);
  }, [currentRegion, vendorPoints]);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          setLocationEnabled(false);
          return;
        }

        setLocationEnabled(true);
        const position = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(coords);
        mapRef.current?.animateCamera({
          center: { latitude: coords.latitude, longitude: coords.longitude },
          zoom: 15,
        });
      } catch (locationError) {
        logger.warn('Unable to read location permissions:', locationError);
      }
    };

    void requestLocation();
  }, []);

  const fetchVendorsForVisibleRegion = useCallback(async (center: LatLng, zoom: number) => {
    if (!getAuth().currentUser) {
      logger.warn('[Map] Skipping fetch — user not authenticated yet');
      setLoading(false);
      return;
    }

    setSearchingNearby(true);
    setError(null);

    const regionHash = toGeohash(center.latitude, center.longitude, MAP_GEOHASH_PRECISION);
    const cacheKey = regionCacheKey(regionHash);

    try {
      // Fast path: use in-memory cache (no async I/O)
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as RegionCachePayload;
        if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
          // Merge into in-memory cache
          cached.vendors.forEach((v) => vendorCacheRef.current.set(v.id, v));
          setLoading(false);
          setSearchingNearby(false);
          setVendors(sortVendorsByDistance(Array.from(vendorCacheRef.current.values()), userLocation));
          return;
        }
      }

      const db = getFirestore();
      const mapsRef = collection(db, 'maps');
      const mapsSnapshot = await getDocs(mapsRef);

      if (mapsSnapshot.empty) {
        logger.warn('[Map] No documents found in maps collection');
        setVendors([]);
        setLoading(false);
        setSearchingNearby(false);
        return;
      }

      const byId = new Map<string, VendorMapItem>();
      let totalVendors = 0;

      mapsSnapshot.docs.forEach((mapDoc) => {
        if (!mapDoc.id.startsWith('locations')) return;

        const locationsData = mapDoc.data() as Record<string, any>;
        if (!locationsData) return;

        const vendorKeys = Object.keys(locationsData);
        totalVendors += vendorKeys.length;

        vendorKeys.forEach((vendorId) => {
          const data = locationsData[vendorId];
          if (!data || typeof data !== 'object') return;

          // Handle string coordinates from Firestore
          const rawLat = data?.latitude;
          const rawLng = data?.longitude;
          const latitude = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
          const longitude = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

          if (!isValidLatLng(latitude, longitude)) {
            logger.warn('[Map] Skipping', vendorId, '- invalid lat/lng:', rawLat, rawLng);
            return;
          }
          if (!isInQatar(latitude, longitude)) {
            logger.warn('[Map] Skipping', vendorId, '- outside Qatar bounds:', latitude, longitude);
            return;
          }

          // Auto-generate geohash if missing
          const geohash = (data?.geohash && typeof data.geohash === 'string')
            ? data.geohash
            : toGeohash(latitude, longitude, MAP_GEOHASH_PRECISION);

          byId.set(vendorId, {
            id: vendorId,
            name: data?.vendorName,
            nameAr: data?.vendorNameAr,
            address: data?.address,
            addressAr: data?.addressAr,
            latitude,
            longitude,
            geohash,
          });
        });
      });

      logger.log('[Map] Found', totalVendors, 'vendor entries across', mapsSnapshot.docs.length, 'documents, parsed', byId.size, 'valid vendors');

      // Merge new vendors into in-memory cache
      byId.forEach((v, id) => vendorCacheRef.current.set(id, v));

      const allVendors = sortVendorsByDistance(Array.from(vendorCacheRef.current.values()), userLocation);
      const payload: RegionCachePayload = {
        fetchedAt: Date.now(),
        vendors: Array.from(byId.values()),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));
      await rememberRegionCacheKey(regionHash);

      setVendors(allVendors);
    } catch (fetchError) {
      logger.error('Failed loading map vendors:', fetchError);
      setError(t('map_load_error'));
    } finally {
      setLoading(false);
      setSearchingNearby(false);
    }
  }, [t, userLocation]);

  // Debounced fetch on region change
  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      if (isClampingRef.current) {
        isClampingRef.current = false;
        setCurrentRegion(region);
        return;
      }

      const clamped = clampRegion(region);
      const didClamp =
        clamped.latitude !== region.latitude ||
        clamped.longitude !== region.longitude ||
        clamped.latitudeDelta !== region.latitudeDelta ||
        clamped.longitudeDelta !== region.longitudeDelta;

      if (didClamp) {
        isClampingRef.current = true;
        mapRef.current?.animateToRegion(clamped, 200);
      }

      setCurrentRegion(clamped);
    },
    []
  );

  // Initial fetch on mount — wait for auth to be ready
  useEffect(() => {
    if (hasFetchedOnceRef.current) return;

    const doFetch = () => {
      if (!getAuth().currentUser) return false;
      hasFetchedOnceRef.current = true;
      const zoom = Math.round(Math.log2(360 / 0.6));
      const center = { latitude: DOHA_CENTER.latitude, longitude: DOHA_CENTER.longitude };
      lastFetchedKeyRef.current = `${toGeohash(center.latitude, center.longitude, MAP_GEOHASH_PRECISION)}-${zoom}`;
      void fetchVendorsForVisibleRegion(center, zoom);
      return true;
    };

    // Try immediately in case auth is already restored
    if (doFetch()) return;

    // Otherwise listen for auth readiness
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      if (user && !hasFetchedOnceRef.current) {
        doFetch();
        unsubscribe();
      }
    });
    return unsubscribe;
  }, [fetchVendorsForVisibleRegion]);

  useEffect(() => {
    if (!userLocation) return;
    setVendors((previous) => sortVendorsByDistance(previous, userLocation));
  }, [userLocation]);

  // Handle navigation from vendor page
  useEffect(() => {
    if (!params.lat || !params.lng) return;
    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);
    if (!isValidLatLng(lat, lng)) return;

    setNavigationTarget({ lat, lng, vendorId: params.vendorId || '' });
    pendingSelectVendorIdRef.current = params.vendorId || null;

    setTimeout(() => {
      mapRef.current?.animateCamera({
        center: { latitude: lat, longitude: lng },
        zoom: 15,
      });
    }, 300);
  }, [params.lat, params.lng, params.vendorId]);

  // Auto-select vendor when data loads after navigation
  useEffect(() => {
    const vendorId = pendingSelectVendorIdRef.current;
    if (!vendorId || !vendors.length) return;
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      pendingSelectVendorIdRef.current = null;
      setSelectedMapVendor(vendor);
      fetchVendorDetail(vendor.id);
    }
  }, [vendors]);

  const fetchVendorDetail = async (vendorId: string) => {
    setFetchingDetail(true);
    try {
      const db = getFirestore();
      const vendorRef = doc(db, 'vendors', vendorId);
      const vendorSnap = await getDoc(vendorRef);
      if (vendorSnap.exists()) {
        setVendorDetail(vendorSnap.data());
      }
    } catch (err) {
      logger.error('Error fetching vendor detail for callout:', err);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleClusterPress = (cluster: ClusterFeature) => {
    const leaves = superclusterRef.current.getLeaves(cluster.properties.cluster_id, Infinity);
    if (!leaves.length) return;

    // Zoom to fit all children
    const coords = leaves.map((l) => ({
      latitude: l.geometry.coordinates[1],
      longitude: l.geometry.coordinates[0],
    }));
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  };

  const centerOnUser = async () => {
    if (!locationEnabled) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;
      setLocationEnabled(true);
    }

    const position = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setUserLocation(coords);
    mapRef.current?.animateCamera({
      center: { latitude: coords.latitude, longitude: coords.longitude },
      zoom: 15,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />

      <View style={[styles.titleBar, isArabic && { alignItems: 'flex-start' }]}>
        <PhonkText style={[styles.headerTitle]}>
          <Text style={{ color: Colors.brandGreen }}>{isArabic ? 'إكس ' : 'X '}</Text>
          <Text style={{ color: Colors.light.text }}>{isArabic ? 'الخريطة' : 'MAP'}</Text>
        </PhonkText>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: DOHA_CENTER.latitude,
            longitude: DOHA_CENTER.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {clusters.map((cluster) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const isCluster = 'cluster' in cluster.properties && cluster.properties.cluster;
            const pointCount = ('point_count' in cluster.properties && cluster.properties.point_count) || 0;
            const clusterId = isCluster ? (cluster as any).id : (cluster as any).id || cluster.properties.id;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${clusterId}`}
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => handleClusterPress(cluster as ClusterFeature)}
                >
                  <View style={[styles.clusterBubble, pointCount > 20 && styles.clusterBubbleLarge]}>
                    <Text style={styles.clusterText}>{pointCount}</Text>
                  </View>
                </Marker>
              );
            }

            const vendorId = cluster.properties.id;

            return (
              <Marker
                key={vendorId}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  const vendor = vendors.find((v) => v.id === vendorId);
                  if (vendor) {
                    setSelectedMapVendor(vendor);
                    setVendorDetail(null);
                    fetchVendorDetail(vendor.id);
                  }
                }}
              >
                <View style={styles.vendorDot} />
              </Marker>
            );
          })}
          {navigationTarget && userLocation && isValidLatLng(navigationTarget.lat, navigationTarget.lng) && (
            <Polyline
              coordinates={[
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: navigationTarget.lat, longitude: navigationTarget.lng },
              ]}
              strokeColor={Colors.brandGreen}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        <View style={styles.floatingSearch} pointerEvents="box-none">
          <View style={styles.searchContainer} pointerEvents="auto">
            <Ionicons name="search" size={20} color={Colors.brandGreen} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_placeholder')}
              placeholderTextColor={Colors.light.tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={Colors.brandGreen} />
            ) : searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color="#AAA" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Pressable style={styles.locationButton} onPress={() => void centerOnUser()}>
          <Ionicons name="locate" size={18} color={Colors.brandGreen} />
        </Pressable>

        {navigationTarget && (
          <TouchableOpacity
            style={styles.cancelNavButton}
            onPress={() => setNavigationTarget(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color={Colors.brandGreen} />
          </TouchableOpacity>
        )}

        {selectedMapVendor && (
          <Pressable
            style={[styles.calloutOverlay, { bottom: insets.bottom + 50 }]}
            onPress={() => {
              setSelectedMapVendor(null);
              setVendorDetail(null);
            }}
          >
            <Pressable style={styles.calloutCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.calloutHeader}>
                <PhonkText style={styles.calloutVendorName} numberOfLines={1}>
                  {isArabic
                    ? (vendorDetail?.nameAr || selectedMapVendor.nameAr || selectedMapVendor.name)
                    : selectedMapVendor.name}
                </PhonkText>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMapVendor(null);
                    setVendorDetail(null);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {!fetchingDetail && vendorDetail?.offers?.length > 0 && (
                <View style={styles.calloutOfferPill}>
                  <Ionicons name="pricetag" size={14} color={Colors.brandGreen} />
                  <PhonkText style={styles.calloutOfferText} numberOfLines={1}>
                    {isArabic
                      ? (vendorDetail.offers[0].titleAr || vendorDetail.offers[0].titleEn || '')
                      : (vendorDetail.offers[0].titleEn || vendorDetail.offers[0].titleAr || '')}
                  </PhonkText>
                </View>
              )}

              {userLocation && (
                <View style={styles.calloutDistanceRow}>
                  <Ionicons name="navigate-outline" size={14} color="#8E8E93" />
                  <Text style={styles.calloutDistanceText}>
                    {haversineDistanceKm(userLocation, { latitude: selectedMapVendor.latitude, longitude: selectedMapVendor.longitude }).toFixed(1)} km
                  </Text>
                </View>
              )}

              <View style={styles.calloutActions}>
                <TouchableOpacity
                  style={styles.calloutViewBtn}
                  onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: selectedMapVendor.id } })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="storefront-outline" size={16} color={Colors.light.text} />
                  <Text style={[styles.calloutBtnText, { color: Colors.light.text }]}>{t('map_callout_view')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calloutDirectionsBtn}
                  onPress={() => {
                    const lat = selectedMapVendor.latitude;
                    const lng = selectedMapVendor.longitude;
                    if (Platform.OS === 'android') {
                      void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                    } else {
                      const rawLabel = isArabic ? (selectedMapVendor.nameAr || selectedMapVendor.name || '') : (selectedMapVendor.name || '');
                      const label = encodeURIComponent(rawLabel);
                      void Linking.openURL(`http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d&q=${label}`).catch(() => {
                        void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate" size={16} color="#FFF" />
                  <Text style={[styles.calloutBtnText, { color: '#FFF' }]}>{t('map_callout_directions')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        )}

        {loading && (
          <View style={styles.overlayCard}>
            <ActivityIndicator size="small" color={Colors.brandGreen} />
            <Text style={styles.overlayText}>{t('map_loading')}</Text>
          </View>
        )}

        {searchQuery.length > 0 && !isSearching && searchedVendorIds?.size === 0 && (
          <View style={styles.overlayCard}>
            <Ionicons name="search-outline" size={18} color={Colors.light.tabIconDefault} />
            <Text style={styles.overlayText}>{t('no_search_results')}</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.overlayError}>
            <Text style={styles.overlayErrorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function sortVendorsByDistance(vendors: VendorMapItem[], userLocation: LatLng | null) {
  if (!userLocation) return vendors;

  return [...vendors]
    .map((vendor) => ({
      ...vendor,
      distanceKm: haversineDistanceKm(userLocation, {
        latitude: vendor.latitude,
        longitude: vendor.longitude,
      }),
    }))
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  titleBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Colors.light.background,
    flexDirection: 'column',
  },
  floatingSearch: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    color: Colors.light.text,
  },
  headerMeta: {
    marginTop: 4,
    color: Colors.light.subtitle,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Typography.poppins.medium,
    color: Colors.light.text,
    padding: 0,
  },
  mapContainer: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  clusterBubble: {
    backgroundColor: Colors.brandGreen,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.88,
  },
  clusterBubbleLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Typography.poppins.semiBold,
  },
  vendorDot: {
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 4,
    borderColor: Colors.brandGreen,
  },
  overlayCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlayText: {
    color: Colors.light.text,
    fontFamily: Typography.poppins.medium,
    fontSize: 13,
  },
  overlayError: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overlayErrorText: {
    color: Colors.light.text,
    textAlign: 'center',
    fontFamily: Typography.poppins.medium,
    fontSize: 13,
  },
  cancelNavButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  calloutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutVendorName: {
    fontSize: 20,
    color: Colors.light.text,
    flex: 1,
    marginRight: 12,
  },
  calloutOfferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  calloutOfferText: {
    fontSize: 14,
    color: Colors.brandGreen,
  },
  calloutDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  calloutDistanceText: {
    fontSize: 13,
    fontFamily: Typography.poppins.medium,
    color: '#8E8E93',
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 12,
  },
  calloutViewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 24,
  },
  calloutDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.brandGreen,
    paddingVertical: 12,
    borderRadius: 24,
  },
  calloutBtnText: {
    fontSize: 14,
    fontFamily: Typography.poppins.semiBold,
  },
});
