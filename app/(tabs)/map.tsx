import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAt,
  where,
  endAt,
} from '@react-native-firebase/firestore';
import { geohashQueryBounds } from 'geofire-common';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import Supercluster from 'supercluster';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import {
  DOHA_CENTER,
  haversineDistanceKm,
  isInQatar,
  isValidLatLng,
  LatLng,
  QATAR_BOUNDS,
  radiusMetersForZoom,
  regionCacheKey,
  rememberRegionCacheKey,
  toGeohash,
} from '../../utils/mapGeo';

function clampRegion(region: Region): Region {
  const minLatDelta = 0.05;
  const minLngDelta = 0.05;
  const latDelta = Math.max(region.latitudeDelta, minLatDelta);
  const lngDelta = Math.max(region.longitudeDelta, minLngDelta);

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
const DEFAULT_ZOOM = 11.5;
const NEARBY_DISTANCE_KM = 20;

type VendorMapItem = {
  id: string;
  name?: string;
  nameAr?: string;
  profilePicture?: string;
  xcard?: boolean;
  isTrending?: boolean;
  latitude: number;
  longitude: number;
  geohash: string;
  distanceKm?: number;
};

type RegionCachePayload = {
  fetchedAt: number;
  vendors: VendorMapItem[];
};

type ClusterPoint = {
  type: 'Feature';
  properties: {
    cluster: boolean;
    id: string;
    name?: string;
    nameAr?: string;
    vendorId?: string;
    point_count?: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isArabic = i18n.language === 'ar';

  const mapRef = useRef<MapView>(null);
  const superclusterRef = useRef<Supercluster>(new Supercluster({ radius: 52, maxZoom: 14 }));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorMapItem[]>([]);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: DOHA_CENTER.latitude,
    longitude: DOHA_CENTER.longitude,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6,
  });
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [searchingNearby, setSearchingNearby] = useState(false);

  const lastFetchedKeyRef = useRef<string | null>(null);
  const isClampingRef = useRef(false);
  const hasFetchedOnceRef = useRef(false);

  const visibleCount = vendors.length;
  const nearbyCount = useMemo(
    () => vendors.filter((vendor) => (vendor.distanceKm ?? Number.POSITIVE_INFINITY) <= NEARBY_DISTANCE_KM).length,
    [vendors]
  );

  // Build GeoJSON points from vendors and load into supercluster
  const vendorPoints: ClusterPoint[] = useMemo(
    () =>
      vendors.map((vendor) => ({
        type: 'Feature' as const,
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
      })),
    [vendors]
  );

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    superclusterRef.current.load(vendorPoints);
    const { longitudeDelta } = currentRegion;
    const zoom = Math.round(Math.log2(360 / longitudeDelta));
    const bounds: [number, number, number, number] = [
      currentRegion.longitude - currentRegion.longitudeDelta / 2,
      currentRegion.latitude - currentRegion.latitudeDelta / 2,
      currentRegion.longitude + currentRegion.longitudeDelta / 2,
      currentRegion.latitude + currentRegion.latitudeDelta / 2,
    ];
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
        console.warn('Unable to read location permissions:', locationError);
      }
    };

    void requestLocation();
  }, []);

  const fetchVendorsForVisibleRegion = useCallback(async (center: LatLng, zoom: number) => {
    setSearchingNearby(true);
    setError(null);

    const regionHash = toGeohash(center.latitude, center.longitude, MAP_GEOHASH_PRECISION);
    const cacheKey = regionCacheKey(regionHash);

    try {
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as RegionCachePayload;
        if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
          setLoading(false);
          setSearchingNearby(false);
          setVendors(sortVendorsByDistance(cached.vendors, userLocation));
          return;
        }
      }

      const radiusMeters = radiusMetersForZoom(zoom);
      const bounds = geohashQueryBounds([center.latitude, center.longitude], radiusMeters);
      const db = getFirestore();

      const snapshots = await Promise.all(
        bounds.map(([start, end]) =>
          getDocs(
            query(
              collection(db, 'vendors'),
              orderBy('geohash'),
              startAt(start),
              endAt(end),
              limit(120)
            )
          )
        )
      );

      const byId = new Map<string, VendorMapItem>();
      snapshots.forEach((snapshot: any) => {
        snapshot.docs.forEach((docSnap: any) => {
          const data = docSnap.data() as any;
          const latitude = data?.latitude;
          const longitude = data?.longitude;
          const geohash = data?.geohash;

          if (!isValidLatLng(latitude, longitude)) return;
          if (!geohash || typeof geohash !== 'string') return;
          if (!isInQatar(latitude, longitude)) return;

          byId.set(docSnap.id, {
            id: docSnap.id,
            name: data?.name,
            nameAr: data?.nameAr,
            profilePicture: data?.profilePicture,
            xcard: data?.xcard === true,
            isTrending: data?.isTrending === true,
            latitude,
            longitude,
            geohash,
          });
        });
      });

      const nextVendors = sortVendorsByDistance(Array.from(byId.values()), userLocation);
      const payload: RegionCachePayload = {
        fetchedAt: Date.now(),
        vendors: nextVendors,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));
      await rememberRegionCacheKey(regionHash);

      setVendors(nextVendors);
    } catch (fetchError) {
      console.error('Failed loading map vendors:', fetchError);
      setError(t('map_load_error'));
    } finally {
      setLoading(false);
      setSearchingNearby(false);
    }
  }, [t, userLocation]);

  // Debounced fetch on region change
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      // Skip fetches triggered by our own clamp animation
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

      // Skip fetch if region hasn't meaningfully changed since last fetch
      const zoom = Math.round(Math.log2(360 / clamped.longitudeDelta));
      const key = `${toGeohash(clamped.latitude, clamped.longitude, MAP_GEOHASH_PRECISION)}-${zoom}`;
      if (key === lastFetchedKeyRef.current) return;
      lastFetchedKeyRef.current = key;

      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(() => {
        void fetchVendorsForVisibleRegion(
          { latitude: clamped.latitude, longitude: clamped.longitude },
          zoom
        );
      }, 450);
    },
    [fetchVendorsForVisibleRegion]
  );

  // Initial fetch on mount so vendors appear immediately
  useEffect(() => {
    if (hasFetchedOnceRef.current) return;
    hasFetchedOnceRef.current = true;
    const zoom = Math.round(Math.log2(360 / 0.6));
    const center = { latitude: DOHA_CENTER.latitude, longitude: DOHA_CENTER.longitude };
    lastFetchedKeyRef.current = `${toGeohash(center.latitude, center.longitude, MAP_GEOHASH_PRECISION)}-${zoom}`;
    void fetchVendorsForVisibleRegion(center, zoom);
  }, [fetchVendorsForVisibleRegion]);

  useEffect(() => {
    if (!userLocation) return;
    setVendors((previous) => sortVendorsByDistance(previous, userLocation));
  }, [userLocation]);

  const handleClusterPress = (cluster: any) => {
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('map')}</Text>
        <Text style={styles.headerMeta}>
          {locationEnabled ? t('nearby_count', { count: nearbyCount }) : t('visible_count', { count: visibleCount })}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: DOHA_CENTER.latitude,
            longitude: DOHA_CENTER.longitude,
            latitudeDelta: 0.6,
            longitudeDelta: 0.6,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
          clusterColor={Colors.brandGreen}
        >
          {clusters.map((cluster) => {
            const [lng, lat] = cluster.geometry.coordinates;
            const isCluster = cluster.properties.cluster;
            const pointCount = cluster.properties.point_count || 0;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => handleClusterPress(cluster)}
                >
                  <View style={[styles.clusterBubble, pointCount > 20 && styles.clusterBubbleLarge]}>
                    <Text style={styles.clusterText}>{pointCount}</Text>
                  </View>
                </Marker>
              );
            }

            return (
              <Marker
                key={cluster.properties.id}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() =>
                  router.push({ pathname: '/vendor/[id]', params: { id: cluster.properties.id } })
                }
              >
                <View style={styles.vendorDot} />
              </Marker>
            );
          })}
        </MapView>

        <Pressable style={styles.locationButton} onPress={() => void centerOnUser()}>
          <Ionicons name="locate" size={18} color={Colors.brandGreen} />
        </Pressable>

        {loading && (
          <View style={styles.overlayCard}>
            <ActivityIndicator size="small" color={Colors.brandGreen} />
            <Text style={styles.overlayText}>{t('map_loading')}</Text>
          </View>
        )}

        {!loading && searchingNearby && (
          <View style={styles.overlayCard}>
            <ActivityIndicator size="small" color={Colors.brandGreen} />
            <Text style={styles.overlayText}>{t('map_refreshing')}</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.overlayError}>
            <Text style={styles.overlayErrorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && vendors.length === 0 && (
          <View style={styles.overlayError}>
            <Text style={styles.overlayErrorText}>{t('no_nearby_vendors')}</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.light.background,
  },
  headerTitle: {
    fontSize: 24,
    color: Colors.light.text,
    fontFamily: Typography.poppins.semiBold,
  },
  headerMeta: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.light.subtitle,
    fontFamily: Typography.poppins.medium,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.88,
  },
  clusterBubbleLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Typography.poppins.semiBold,
  },
  vendorDot: {
    backgroundColor: '#FFFFFF',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
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
});
