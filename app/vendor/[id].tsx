import { pickLocalizedText } from '../../utils/textFallback';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { deleteDoc, doc, getFirestore, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useQuery } from '@tanstack/react-query';
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useAppLocale } from '../../context/LocaleContext';
import { logger } from '../../utils/logger';
import { Typography } from '../../constants/Typography';
import AppText from '../../components/AppText';
import { StateSurface } from '../../components/StateSurface';
import { VendorGallery } from '../../components/vendor/VendorGallery';
import { haversineDistanceKm, isValidLatLng, LatLng } from '../../utils/mapGeo';
import { fetchSavedOfferIds, fetchVendorRoute } from '../../utils/firebaseQueries';
import { queryClient, queryKeys } from '../../utils/queryClient';
import { useRealXRefresh } from '../../components/PullToRefresh';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { RemoteImage } from '../../components/RemoteImage';

type VendorBranch = {
    id: string;
    name?: string;
    nameAr?: string;
    phoneNumber?: string;
    address?: string;
    addressAr?: string;
    latitude?: number;
    longitude?: number;
    isPrimary?: boolean;
    distanceKm?: number;
};

function getVendorBranches(vendor: any): VendorBranch[] {
    const rawLocations = Array.isArray(vendor?.locations) && vendor.locations.length > 0
        ? vendor.locations
        : [{
            id: 'primary',
            phoneNumber: vendor?.phoneNumber,
            address: vendor?.address,
            addressAr: vendor?.addressAr,
            latitude: vendor?.latitude ?? vendor?.lat,
            longitude: vendor?.longitude ?? vendor?.lng,
            isPrimary: true,
        }];

    return rawLocations
        .map((location: any, index: number) => {
            const latitude = typeof location?.latitude === 'string' ? parseFloat(location.latitude) : location?.latitude;
            const longitude = typeof location?.longitude === 'string' ? parseFloat(location.longitude) : location?.longitude;
            return {
                id: String(location?.id || (location?.isPrimary ? 'primary' : `branch-${index + 1}`)),
                name: location?.name,
                nameAr: location?.nameAr,
                phoneNumber: typeof location?.phoneNumber === 'string' ? location.phoneNumber.trim() : undefined,
                address: location?.address || vendor?.address,
                addressAr: location?.addressAr || vendor?.addressAr,
                latitude,
                longitude,
                isPrimary: location?.isPrimary === true || index === 0,
            };
        })
        .filter((location: VendorBranch) => isValidLatLng(location.latitude, location.longitude));
}

function getDialablePhoneNumber(phoneNumber?: string) {
    const normalized = phoneNumber?.replace(/[^\d+]/g, '') || '';
    return normalized.length > 0 ? normalized : null;
}

function callPhoneNumber(phoneNumber?: string) {
    const dialable = getDialablePhoneNumber(phoneNumber);
    if (!dialable) return;
    void Linking.openURL(`tel:${dialable}`);
}

function formatBranchDistance(distanceKm: number) {
    if (distanceKm >= 100) {
        return `${Math.round(distanceKm)} km away`;
    }
    return `${distanceKm.toFixed(1)} km away`;
}

export default function VendorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const { t } = useTranslation();
    const { isDark, theme } = useAppTheme();
    const { isAuthenticated, requireAuth } = useAuthAccess();
    const { locale } = useAppLocale();
    const isArabic = locale === 'ar';
    const [vendor, setVendor] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [actualVendorId, setActualVendorId] = useState<string | null>(null);
    const [savedOfferIds, setSavedOfferIds] = useState<Set<string>>(new Set());
    const [savingOfferIds, setSavingOfferIds] = useState<Set<string>>(new Set());
    const [branchPickerVisible, setBranchPickerVisible] = useState(false);
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);
    const [onlineWebsiteLoading, setOnlineWebsiteLoading] = useState(false);
    const [onlineCodeCopied, setOnlineCodeCopied] = useState(false);
    const currentUserId = getAuth().currentUser?.uid ?? null;
    const vendorLookupId = typeof id === 'string' ? id : '';

    const {
        data: vendorRouteData,
        error: vendorRouteError,
        isLoading,
        refetch: refetchVendor,
    } = useQuery({
        queryKey: queryKeys.vendorRoute(vendorLookupId, isArabic ? 'ar' : 'en'),
        queryFn: () => fetchVendorRoute(vendorLookupId, isArabic),
        enabled: vendorLookupId.length > 0,
    });

    const { isOnline } = useConnectivity();

    const {
        data: onlineOffer,
        error: onlineOfferError,
        isFetching: onlineOfferLoading,
        refetch: refetchOnlineOffer,
    } = useQuery({
        queryKey: queryKeys.onlineVendorOffer(vendorLookupId),
        queryFn: async () => {
            const functions = getFunctions(undefined, 'me-central1');
            const getOnlineVendorOffer = httpsCallable(functions, 'getOnlineVendorOffer');
            const result = await getOnlineVendorOffer({ vendorId: vendorLookupId });
            return result.data as { discountCode: string };
        },
        enabled: isAuthenticated && vendorLookupId.length > 0 && vendor?.vendorType === 'online',
    });

    const handleCopyOnlineCode = async () => {
        if (!onlineOffer?.discountCode) {
            requireAuth('guest_redeem_message');
            return;
        }

        triggerSubtleHaptic();
        await Clipboard.setStringAsync(onlineOffer.discountCode);
        setOnlineCodeCopied(true);
        setTimeout(() => setOnlineCodeCopied(false), 1600);
    };

    const handleOnlineWebsite = async () => {
        if (!requireAuth('guest_redeem_message')) return;

        const currentVendorId = actualVendorId || vendorLookupId;
        if (!currentVendorId) return;

        setOnlineWebsiteLoading(true);
        try {
            const functions = getFunctions(undefined, 'me-central1');
            const recordOutboundClick = httpsCallable(functions, 'recordOnlineVendorOutboundClick');
            const requestId = `online-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
            const result = await recordOutboundClick({ vendorId: currentVendorId, requestId });
            const data = result.data as { purchaseUrl?: string };

            if (!data.purchaseUrl) throw new Error(t('online_store_access_failed_message'));
            await Linking.openURL(data.purchaseUrl);
        } catch (error: any) {
            logger.error('Online store visit error:', error);
            Alert.alert(
                t('online_store_access_failed_title'),
                error.message || t('online_store_access_failed_message')
            );
        } finally {
            setOnlineWebsiteLoading(false);
        }
    };
    const refreshVendor = useCallback(async () => {
        await refetchVendor();
        if (currentUserId && actualVendorId) {
            await queryClient.refetchQueries({
                queryKey: queryKeys.savedOfferIds(currentUserId, actualVendorId),
                type: 'active',
            });
        }
    }, [actualVendorId, currentUserId, refetchVendor]);
    const { refreshControl, refreshOverlay } = useRealXRefresh({ onRefresh: refreshVendor });

    useEffect(() => {
        if (vendorRouteError) logger.error("Error fetching vendor data:", vendorRouteError);
    }, [vendorRouteError]);

    useEffect(() => {
        if (!vendorRouteData) {
            setVendor(null);
            setOffers([]);
            setActualVendorId(null);
            return;
        }

        setActualVendorId(vendorRouteData.vendorId);
        setVendor(vendorRouteData.vendorData);
        setOffers((vendorRouteData.vendorData.offers || []).map((offer: any, index: number) => ({
            id: `${vendorRouteData.vendorId}_offer_${index}`,
            offerIndex: index,
            ...offer,
        })));
    }, [vendorRouteData]);

    const {
        data: savedOfferIdsQueryData,
        error: savedOfferIdsError,
    } = useQuery<Set<string>>({
        queryKey: currentUserId && actualVendorId ? queryKeys.savedOfferIds(currentUserId, actualVendorId) : ['savedOfferIds', 'anonymous'],
        queryFn: () => currentUserId && actualVendorId
            ? fetchSavedOfferIds(currentUserId, actualVendorId)
            : Promise.resolve(new Set<string>()),
        enabled: !!currentUserId && !!actualVendorId,
    });

    useEffect(() => {
        if (savedOfferIdsQueryData) setSavedOfferIds(savedOfferIdsQueryData);
    }, [savedOfferIdsQueryData]);

    useEffect(() => {
        if (savedOfferIdsError) logger.error('Error loading saved offers:', savedOfferIdsError);
    }, [savedOfferIdsError]);

    useEffect(() => {
        const loadUserLocation = async () => {
            try {
                const currentPermission = await Location.getForegroundPermissionsAsync();
                const finalPermission = currentPermission.granted
                    ? currentPermission
                    : await Location.requestForegroundPermissionsAsync();

                if (!finalPermission.granted) return;

                const position = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            } catch (error) {
                logger.warn('Unable to load location for nearest branch:', error);
            }
        };

        if (vendor && vendor.vendorType !== 'online') {
            void loadUserLocation();
        }
    }, [vendor]);

    const branches = useMemo(() => {
        if (!vendor) return [];
        const parsedBranches = getVendorBranches(vendor);
        if (!userLocation) return parsedBranches;
        return parsedBranches
            .map((branch) => ({
                ...branch,
                distanceKm: haversineDistanceKm(userLocation, {
                    latitude: branch.latitude!,
                    longitude: branch.longitude!,
                }),
            }))
            .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
    }, [userLocation, vendor]);

    const nearestBranch = branches[0] || null;
    const branchListMaxHeight = Math.max(260, Math.min(520, windowHeight * 0.58 - insets.bottom));
    const openBranchOnMap = (branch: VendorBranch) => {
        if (!isValidLatLng(branch.latitude, branch.longitude)) return;
        router.push({
            pathname: '/(tabs)/map',
            params: {
                vendorId: actualVendorId || id,
                lat: String(branch.latitude),
                lng: String(branch.longitude),
                locationId: branch.id,
            },
        });
        setBranchPickerVisible(false);
    };

    const toggleSavedOffer = async (offer: any, offerIndex: number) => {
        const user = getAuth().currentUser;
        const vendorId = actualVendorId || id;
        if (!user || !vendorId) {
            requireAuth('guest_save_offer_message');
            return;
        }

        const savedId = `${vendorId}_offer_${offerIndex}`;
        if (savingOfferIds.has(savedId)) return;

        setSavingOfferIds((previous) => new Set(previous).add(savedId));
        try {
            const db = getFirestore();
            const savedRef = doc(db, 'students', user.uid, 'savedItems', savedId);

            if (savedOfferIds.has(savedId)) {
                await deleteDoc(savedRef);
                setSavedOfferIds((previous) => {
                    const next = new Set(previous);
                    next.delete(savedId);
                    queryClient.setQueryData(queryKeys.savedOfferIds(user.uid, vendorId), next);
                    return next;
                });
                await queryClient.invalidateQueries({ queryKey: queryKeys.savedOffers(user.uid) });
                return;
            }

            await setDoc(savedRef, {
                type: 'offer',
                vendorId,
                offerIndex,
                vendorName: vendor.name || '',
                vendorNameAr: vendor.nameAr || '',
                vendorLogo: vendor.profilePicture || '',
                vendorCoverImage: vendor.coverImage || '',
                titleEn: offer.titleEn || '',
                titleAr: offer.titleAr || '',
                descriptionEn: offer.descriptionEn || '',
                descriptionAr: offer.descriptionAr || '',
                discountType: offer.discountType || '',
                discountValue: offer.discountValue ?? null,
                xcard: !!offer.xcard || !!vendor.xcard,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setSavedOfferIds((previous) => {
                const next = new Set(previous).add(savedId);
                queryClient.setQueryData(queryKeys.savedOfferIds(user.uid, vendorId), next);
                return next;
            });
            await queryClient.invalidateQueries({ queryKey: queryKeys.savedOffers(user.uid) });
        } catch (error) {
            logger.error('Error toggling saved offer:', error);
            Alert.alert(t('error'), t('saved_offer_failed'));
        } finally {
            setSavingOfferIds((previous) => {
                const next = new Set(previous);
                next.delete(savedId);
                return next;
            });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <StateSurface kind="loading" />
            </View>
        );
    }

    if (!vendor) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                <StateSurface kind={vendorRouteError ? (isOnline ? 'error' : 'offline') : 'not-found'} title={vendorRouteError ? undefined : t('vendor_not_found')} onRetry={vendorRouteError ? () => void refetchVendor() : undefined} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} animated hidden />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={refreshControl}
            >
                {/* Header Image Section */}
                <View style={styles.headerContainer}>
                    <RemoteImage
                        source={{ uri: vendor.coverImage }}
                        style={styles.coverImage}
                        contentFit="cover"
                        transition={200}
                    />

                    {/* Header Buttons */}
                    <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                        <View style={styles.headerButtonsRow}>
                            <TouchableOpacity
                                style={[styles.roundButton, { backgroundColor: theme.logoTile, borderColor: theme.logoTileBorder }]}
                                onPress={() => router.back()}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={isArabic ? 'arrow-forward' : 'arrow-back'} size={24} color={theme.logoTileText} />
                            </TouchableOpacity>

                        </View>
                    </SafeAreaView>

                    {/* Vendor Logo Overlapping */}
                    <View style={styles.logoContainer}>
                        <RemoteImage
                            source={{ uri: vendor.profilePicture }}
                            style={[styles.logoImage, { backgroundColor: theme.logoTile, borderColor: theme.logoTileBorder }]}
                            contentFit="contain"
                        />
                    </View>

                </View>

                {/* Vendor Details */}
                <View style={[styles.detailsContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.vendorHeaderRow}>
                        {vendor.integralLogo ? (
                            <RemoteImage
                                source={{ uri: vendor.integralLogo }}
                                style={styles.integralLogo}
                                contentFit="contain"
                            />
                        ) : (
                            <AppText style={[{ color: theme.text }, styles.vendorName]}>{pickLocalizedText(isArabic, vendor.nameAr, vendor.name, 'Vendor')}</AppText>
                        )}
                    </View>

                    <View style={styles.metaStack}>
                        {vendor.vendorType === 'online' ? (
                            <View style={[styles.onlineMetaLine, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                {vendor.phoneNumber ? (
                                    <TouchableOpacity
                                        style={[styles.phoneButton, { backgroundColor: theme.cardMuted }]}
                                        onPress={() => callPhoneNumber(vendor.phoneNumber)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="call-outline" size={15} color={theme.brand} />
                                        <Text style={[styles.phoneButtonText, { color: theme.text }]} numberOfLines={1}>
                                            {vendor.phoneNumber}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                <View style={[styles.tagsRow, { justifyContent: isArabic ? 'flex-start' : 'flex-end' }]}>
                                    <View style={[styles.tagChip, { backgroundColor: '#2563EB' }]}>
                                        <Ionicons name="globe-outline" size={14} color="#FFF" />
                                        <Text style={[styles.tagText, { ...Typography.getTextVariantStyle('bodyStrong') }]} numberOfLines={1}>{t('online_vendor_label')}</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                        <View style={[styles.metaLine, styles.metaLineSpread]}>
                            <TouchableOpacity style={[styles.locationButton, { backgroundColor: theme.cardMuted }]} onPress={() => {
                                if (branches.length > 1) {
                                    setBranchPickerVisible(true);
                                    return;
                                }

                                if (branches.length === 1) {
                                    openBranchOnMap(branches[0]);
                                    return;
                                }

                                const vendorName = pickLocalizedText(isArabic, vendor.nameAr, vendor.name, 'Vendor');
                                const q = encodeURIComponent(vendorName + " Qatar");
                                void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
                            }} activeOpacity={0.7}>
                                <Ionicons name="location-outline" size={18} color={theme.brand} />
                                <Text style={[styles.locationText, { color: theme.text, ...Typography.getTextVariantStyle('body') }]} numberOfLines={1}>
                                    {branches.length > 1 ? `${t('location')} (${branches.length})` : t('location')}
                                </Text>
                            </TouchableOpacity>
                            {nearestBranch?.distanceKm != null && (
                                <View style={[styles.nearestBranchChip, { backgroundColor: theme.brandSoft }]}>
                                    <Ionicons name="navigate-outline" size={13} color={theme.brand} />
                                    <Text style={[styles.nearestBranchText, { color: theme.brandText }]} numberOfLines={1}>{nearestBranch.distanceKm.toFixed(1)} km</Text>
                                </View>
                            )}
                        </View>

                        <View style={[styles.metaLine, styles.metaLineSpread]}>
                            {nearestBranch?.phoneNumber ? (
                                <TouchableOpacity
                                    style={[styles.phoneButton, { backgroundColor: theme.cardMuted }]}
                                    onPress={() => callPhoneNumber(nearestBranch.phoneNumber)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="call-outline" size={15} color={theme.brand} />
                                    <Text style={[styles.phoneButtonText, { color: theme.text }]} numberOfLines={1}>
                                        {nearestBranch.phoneNumber}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            <View style={styles.tagsRow}>
                                {vendor.trending && (
                                    <View style={styles.tagChip}>
                                        <Ionicons name="trending-up" size={14} color="#FFF" />
                                        <Text style={[styles.tagText, { ...Typography.getTextVariantStyle('bodyStrong') }]} numberOfLines={1}>{t('trending')}</Text>
                                    </View>
                                )}
                                {vendor.xcard && (
                                    <View style={[styles.tagChip, { backgroundColor: theme.brand }]}>
                                        <Ionicons name="cash-outline" size={14} color="#FFF" />
                                        <Text style={[styles.tagText, { ...Typography.getTextVariantStyle('bodyStrong') }]} numberOfLines={1}>{t('cashback')}</Text>
                                    </View>
                                )}
                                {vendor.vendorType === 'online' && (
                                    <View style={[styles.tagChip, { backgroundColor: '#2563EB' }]}>
                                        <Ionicons name="globe-outline" size={14} color="#FFF" />
                                        <Text style={[styles.tagText, { ...Typography.getTextVariantStyle('bodyStrong') }]} numberOfLines={1}>{t('online_vendor_label')}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                            </>
                        )}
                    </View>

                    <VendorGallery images={vendor.galleryImages} isArabic={isArabic} />

                    {/* Offers List */}
                    <View style={styles.offersList}>
                        {vendor.vendorType === 'online' ? (
                            <View style={styles.offerCard}>
                                <View style={[styles.offerInfoContainer, styles.onlineOfferInfoContainer, { backgroundColor: theme.cardMuted }]}>
                                    <View style={[styles.offerContent, styles.onlineOfferContent]}>
                                        <AppText style={[{ color: theme.text }, styles.offerTitle, styles.onlineOfferTitle, { textAlign: isArabic ? 'right' : 'left' }]}>
                                            {pickLocalizedText(isArabic, vendor.brandOfferNameAr, vendor.brandOfferName, t('online_vendor_title'))}
                                        </AppText>
                                        <TouchableOpacity
                                            style={[styles.onlineCodeBox, { backgroundColor: theme.brandSoft, borderColor: theme.brand, flexDirection: isArabic ? 'row-reverse' : 'row' }]}
                                            onPress={() => void handleCopyOnlineCode()}
                                            disabled={onlineOfferLoading}
                                            activeOpacity={0.85}
                                            accessibilityRole="button"
                                            accessibilityLabel={onlineOffer?.discountCode ? t('online_copy_hint') : t('online_sign_in_to_view_code')}
                                        >
                                            {onlineOfferLoading ? (
                                                <ActivityIndicator size="small" color={theme.brand} />
                                            ) : (
                                                <Text style={[styles.onlineCodeText, { color: theme.brandText }]}>
                                                    {onlineOffer?.discountCode || '----'}
                                                </Text>
                                            )}
                                            <Ionicons name={onlineCodeCopied ? 'checkmark-circle' : 'copy-outline'} size={24} color={theme.brand} />
                                        </TouchableOpacity>
                                        {onlineOfferError || onlineCodeCopied ? (
                                            <Text style={[styles.onlineCodeHint, { color: onlineOfferError ? theme.danger : theme.mutedText, textAlign: 'center' }]}>
                                                {onlineOfferError
                                                    ? (onlineOfferError as any).message || t('online_store_access_failed_message')
                                                    : t('online_code_copied')}
                                            </Text>
                                        ) : null}
                                        {onlineOfferError && isAuthenticated ? (
                                            <TouchableOpacity onPress={() => void refetchOnlineOffer()} disabled={onlineOfferLoading}>
                                                <Text style={[styles.onlineRetryText, { color: theme.brandText }]}>{t('retry')}</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>

                                <View style={[styles.offerActionsRow, { backgroundColor: theme.cardMuted }]}>
                                    <TouchableOpacity
                                        style={[styles.pillButton, styles.redeemPill, { backgroundColor: theme.actionSolid }]}
                                        onPress={() => void handleOnlineWebsite()}
                                        disabled={onlineWebsiteLoading}
                                    >
                                        {onlineWebsiteLoading ? <ActivityIndicator size="small" color={theme.onActionSolid} /> : <Ionicons name="open-outline" size={18} color={theme.onActionSolid} />}
                                        <Text style={[{ color: theme.onActionSolid, ...Typography.getTextVariantStyle('body') }, styles.pillButtonTextSmall]}>{t('online_visit_website_caps')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                        offers.map((offer) => {
const percentValue =
    offer.discountType === 'percentage' && offer.discountValue
        ? `${offer.discountValue}%`
        : offer.discountType === 'buy1get1'
            ? 'BUY 1 GET 1'
            : '';

const offerTitle = isArabic
    ? (percentValue ? `خصم ${percentValue}` : (offer.titleAr || offer.titleEn))
    : (offer.titleEn || offer.titleAr);
const offerIndex = offer.offerIndex ?? offers.indexOf(offer);
const savedId = `${actualVendorId || id}_offer_${offerIndex}`;
const isSaved = savedOfferIds.has(savedId);
const offerDescription = isArabic
    ? (offer.descriptionAr || offer.descriptionEn || t('no_specific_terms'))
    : (offer.descriptionEn || offer.descriptionAr || t('no_specific_terms'));
                            return (
                                <View key={offer.id} style={styles.offerCard}>
                                    {offer.xcard && (
                                        <Image
                                            source={require('../../assets/images/cashback.webp')}
                                            style={styles.xcardBadge}
                                        />
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.offerSaveButton,
                                            { backgroundColor: isSaved ? theme.brand : theme.card, shadowColor: theme.shadow },
                                            isSaved && styles.offerSaveButtonActive,
                                        ]}
                                        onPress={() => void toggleSavedOffer(offer, offerIndex)}
                                        disabled={savingOfferIds.has(savedId)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={isSaved ? 'bookmark' : 'bookmark-outline'}
                                            size={22}
                                            color={isSaved ? theme.onActionSolid : theme.brand}
                                        />
                                    </TouchableOpacity>
                                    {/* Top Info Pill */}
                                    <View style={[styles.offerInfoContainer, { backgroundColor: theme.cardMuted }]}>
                                        <View style={styles.offerContent}>
                                            <AppText style={[{ color: theme.text }, styles.offerTitle]}>
                                                {(offerTitle || "").split(/(\d+(?:\.\d+)?\s?%?)/).map((part: string, index: number) =>
                                                    /^\d+(?:\.\d+)?\s?%?$/.test(part) ? (
                                                        <AppText key={index} style={styles.greenText}>{part}</AppText>
                                                    ) : (
                                                        part
                                                    )
                                                )}
                                            </AppText>
                                            <Text
                                                style={[styles.offerSummary, { color: theme.mutedText, textAlign: isArabic ? 'right' : 'left' }]}
                                                numberOfLines={2}
                                            >
                                                {offerDescription}
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Bottom Button Pills */}
                                    <View style={[styles.offerActionsRow, { backgroundColor: theme.cardMuted }]}>
                                        <TouchableOpacity
                                            style={[styles.pillButton, styles.redeemPill, { backgroundColor: theme.actionSolid }]}
                                            onPress={() => {
                                                if (!requireAuth('guest_redeem_message')) return;
                                                router.push(`/redeem/${actualVendorId || id}?vendorId=${actualVendorId || id}&offerIndex=${offerIndex}`);
                                            }}
                                        >
                                            <Ionicons name="flash" size={18} color={theme.onActionSolid} />
                                            <Text style={[{ color: theme.onActionSolid, ...Typography.getTextVariantStyle('body') }, styles.pillButtonTextSmall]}>{t('redeem_caps')}</Text>
                                        </TouchableOpacity>

                                    </View>
                                </View>
                            );
                        })
                        )}
                    </View>
                </View>
            </ScrollView>
            {refreshOverlay}

            <Modal
                visible={branchPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setBranchPickerVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setBranchPickerVisible(false)}>
                    <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} tintColor="rgba(0,0,0,0.3)" />
                    <Pressable
                        style={[
                            styles.drawerContainer,
                            {
                                backgroundColor: theme.card,
                                paddingBottom: insets.bottom + 20
                            }
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.handleContainer}>
                            <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
                        </View>

                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <AppText style={[{ color: theme.text, textAlign: isArabic ? 'right' : 'left' }, styles.modalTitleText]}>
                                    {isArabic ? 'الفروع' : 'BRANCHES'}
                                </AppText>
                                <TouchableOpacity
                                    onPress={() => setBranchPickerVisible(false)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close-circle" size={28} color={theme.icon} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={[styles.branchListScroll, { maxHeight: branchListMaxHeight }]}
                                contentContainerStyle={styles.branchListContent}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                                nestedScrollEnabled
                            >
                                {branches.map((branch, index) => {
                                    const branchName = isArabic
                                        ? (branch.nameAr || branch.name || `${isArabic ? 'فرع' : 'Branch'} ${index + 1}`)
                                        : (branch.name || branch.nameAr || `Branch ${index + 1}`);
                                    const address = isArabic
                                        ? (branch.addressAr || branch.address || '')
                                        : (branch.address || branch.addressAr || '');

                                    return (
                                        <TouchableOpacity
                                            key={branch.id}
                                            style={[styles.branchRow, { backgroundColor: theme.cardMuted }]}
                                            onPress={() => openBranchOnMap(branch)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.branchMainRow}>
                                                <View style={[styles.branchIcon, { backgroundColor: theme.card }]}>
                                                    <Ionicons name={index === 0 ? 'navigate' : 'location-outline'} size={18} color={theme.brand} />
                                                </View>
                                                <View style={styles.branchTextBlock}>
                                                    <View style={styles.branchTitleRow}>
                                                        <Text style={[styles.branchName, { color: theme.text }]} numberOfLines={1}>{branchName}</Text>
                                                        {index === 0 && branch.distanceKm != null && (
                                                            <View style={[styles.branchNearestPill, { backgroundColor: theme.brand }]}>
                                                                <Text style={[styles.branchNearestText, { color: theme.onActionSolid }]}>Nearest</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    {address ? <Text style={[styles.branchAddress, { color: theme.mutedText }]} numberOfLines={2}>{address}</Text> : null}
                                                </View>
                                            </View>
                                            <View style={[styles.branchMetaRow, styles.branchMetaRowSpread]}>
                                                {branch.phoneNumber ? (
                                                    <TouchableOpacity
                                                        style={[styles.branchPhoneChip, { backgroundColor: theme.card }]}
                                                        onPress={(event) => {
                                                            event.stopPropagation();
                                                            callPhoneNumber(branch.phoneNumber);
                                                        }}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Ionicons name="call-outline" size={14} color={theme.brand} />
                                                        <Text style={[styles.branchPhoneText, { color: theme.text }]} numberOfLines={1}>
                                                            {branch.phoneNumber}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : null}
                                                {branch.distanceKm != null && (
                                                    <View style={[styles.branchDistanceChip, { backgroundColor: theme.brandSoft }]}>
                                                        <Ionicons name="navigate-outline" size={13} color={theme.brand} />
                                                        <Text style={[styles.branchDistance, { color: theme.brandText }]}>{formatBranchDistance(branch.distanceKm)}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('body'),
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    roundButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        position: 'absolute',
        bottom: -20, // Overlap
        left: 20,
        width: 100,
        height: 100,
        zIndex: 5,
        elevation: 5,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: 'transparent',
    },
    detailsContainer: {
        paddingTop: 30, // Space for logo overlap
        paddingHorizontal: 20,
    },
    vendorHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    vendorName: {
        fontSize: 26,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    integralLogo: {
        width: 180,
        height: 60,
    },
    rightChips: {
        flexDirection: 'row',
        gap: 8,
    },
    metaStack: {
        marginTop: 12,
        gap: 10,
    },
    metaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
    },
    metaLineSpread: {
        justifyContent: 'space-between',
    },
    onlineMetaLine: {
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        minHeight: 42,
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        flex: 1,
        justifyContent: 'flex-end',
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    tagText: {
        fontSize: 12,
        color: '#FFF',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        maxWidth: '58%',
    },
    locationText: {
        fontSize: 14,
        flexShrink: 1,
    },
    nearestBranchChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 110,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 18,
    },
    nearestBranchText: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    phoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        maxWidth: '48%',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 18,
    },
    phoneButtonText: {
        flexShrink: 1,
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    onlineCodeBox: {
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        minHeight: 58,
        marginTop: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 18,
        gap: 12,
    },
    onlineCodeText: {
        flex: 1,
        fontSize: 22,
        letterSpacing: 1.5,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textAlign: 'center',
    },
    onlineCodeHint: {
        marginTop: 7,
        fontSize: 13,
        ...Typography.getTextVariantStyle('body'),
        lineHeight: 18,
    },
    onlineRetryText: {
        marginTop: 6,
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    categoryEmoji: {
        fontSize: 12,
    },
    categoryText: {
        fontSize: 12,
        ...Typography.getTextVariantStyle('body'),
    },
    offersList: {
        marginTop: 24,
        gap: 20,
    },
    offerCard: {
        marginBottom: 8,
        position: 'relative',
    },
    xcardBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
    },
    offerInfoContainer: {
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingEnd: 72,
        minHeight: 82,
        position: 'relative',
    },
    onlineOfferInfoContainer: {
        paddingEnd: 24,
    },
    offerContent: {
        gap: 4,
    },
    onlineOfferContent: {
        alignItems: 'center',
        width: '100%',
    },
    onlineOfferTitle: {
        textAlign: 'center',
    },
    offerTitle: {
        fontSize: 20,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    greenText: {
        color: Colors.brandGreen,
    },
    offerSubtitle: {
        fontSize: 15,
        ...Typography.getTextVariantStyle('body'),
        color: '#8E8E93',
    },
    offerSummary: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
        lineHeight: 20,
        paddingEnd: 8,
    },
    offerActionsRow: {
        flexDirection: 'row',
        gap: 12,
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    pillButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 30,
        gap: 8,
    },
    redeemPill: {
    },
    offerSaveButton: {
        position: 'absolute',
        top: 12,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 8,
        zIndex: 40,
    },
    offerSaveButtonActive: {
    },
    pillButtonTextSmall: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
    modalContent: {
        paddingHorizontal: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitleText: {
        fontSize: 20,
        letterSpacing: 0.5,
    },
    descriptionText: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('body'),
        lineHeight: 24,
    },
    branchListScroll: {
        flexGrow: 0,
    },
    branchListContent: {
        gap: 12,
        paddingBottom: 10,
    },
    branchRow: {
        gap: 10,
        borderRadius: 20,
        padding: 14,
    },
    branchMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    branchIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    branchTextBlock: {
        flex: 1,
        gap: 3,
    },
    branchTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    branchName: {
        flex: 1,
        fontSize: 15,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    branchNearestPill: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    branchNearestText: {
        fontSize: 10,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textTransform: 'uppercase',
    },
    branchAddress: {
        fontSize: 13,
        ...Typography.getTextVariantStyle('body'),
    },
    branchMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        paddingStart: 52,
    },
    branchMetaRowSpread: {
        justifyContent: 'flex-start',
    },
    branchPhoneChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flexShrink: 1,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 18,
    },
    branchPhoneText: {
        flexShrink: 1,
        fontSize: 15,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    branchDistanceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 18,
    },
    branchDistance: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
});
