import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import RestaurantCard from '../category/RestaurantCard';
import { StateSurface } from '../StateSurface';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { homeQueryOptions } from '../../utils/homeQueries';
import HomeSectionHeading from './HomeSectionHeading';
import {
    HOME_CAROUSEL_GAP,
    HOME_HORIZONTAL_GUTTER,
    HOME_SECTION_TOP_SPACING,
} from './layout';

type TrendingOffersProps = {
    onVendorPress?: (vendor: any) => void;
    variant?: 'trending' | 'newDeals';
};

const OFFER_CARD_GAP = HOME_CAROUSEL_GAP;
const OFFER_SIDE_PADDING = HOME_HORIZONTAL_GUTTER;
const OFFER_CARD_WIDTH_RATIO = 0.60;
const OFFER_AUTO_SCROLL_MS = 4000;
const NEW_DEALS_TOP_SPACING = 4;
export default function TrendingOffers({ onVendorPress, variant = 'trending' }: TrendingOffersProps) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isRTL } = useAppLocale();
    const {
        data: vendors = [],
        error,
        isLoading,
        refetch,
    } = useQuery(homeQueryOptions.offers(variant));
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentIndexRef = useRef(0);
    const scrollViewRef = useRef<ScrollView | null>(null);
    const isUserInteractingRef = useRef(false);
    const { width: screenWidth } = useWindowDimensions();
    const router = useRouter();
    const displayedVendors = useMemo(() => (isRTL ? [...vendors].reverse() : vendors), [vendors, isRTL]);
    const offerCardWidth = screenWidth * OFFER_CARD_WIDTH_RATIO;
    const offerScrollInterval = offerCardWidth + OFFER_CARD_GAP;
    const labelPrefix = t(variant === 'trending' ? 'trending_label_prefix' : 'new_deals_label_prefix');
    const labelHighlight = t(variant === 'trending' ? 'trending_label_highlight' : 'new_deals_label_highlight');

    useEffect(() => {
        if (error) logger.error(`Error fetching ${variant === 'trending' ? 'trending' : 'new deal'} vendors:`, error);
    }, [error, variant]);

    useEffect(() => {
        if (displayedVendors.length <= 1) {
            return;
        }

        const interval = setInterval(() => {
            if (isUserInteractingRef.current) {
                return;
            }

            const nextIndex = (currentIndexRef.current + 1) % displayedVendors.length;
            currentIndexRef.current = nextIndex;
            setCurrentIndex(nextIndex);
        }, OFFER_AUTO_SCROLL_MS);

        return () => clearInterval(interval);
    }, [displayedVendors.length]);

    useEffect(() => {
        if (!scrollViewRef.current || displayedVendors.length === 0) {
            return;
        }

        const maxIndex = Math.max(0, displayedVendors.length - 1);
        const safeIndex = Math.min(currentIndex, maxIndex);

        scrollViewRef.current.scrollTo({
            x: safeIndex * offerScrollInterval,
            animated: true,
        });
    }, [currentIndex, displayedVendors.length, offerScrollInterval]);

    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (displayedVendors.length <= 1) {
            isUserInteractingRef.current = false;
            return;
        }

        const maxIndex = Math.max(0, displayedVendors.length - 1);
        const nextIndex = Math.min(
            maxIndex,
            Math.max(0, Math.round(event.nativeEvent.contentOffset.x / offerScrollInterval)),
        );

        currentIndexRef.current = nextIndex;
        isUserInteractingRef.current = false;
    };

    const handleScrollBegin = () => {
        isUserInteractingRef.current = true;
    };

    const handleVendorPress = (vendor: any) => {
        if (onVendorPress) {
            onVendorPress(vendor);
        } else if (vendor.vendorId) {
            router.push({ pathname: '/vendor/[id]', params: { id: vendor.vendorId } });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="small" color={theme.brand} />
            </View>
        );
    }

    if (error && displayedVendors.length === 0) {
        return <StateSurface kind="error" compact onRetry={() => void refetch()} />;
    }

    if (displayedVendors.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, variant === 'newDeals' && styles.newDealsContainer]}>
            <HomeSectionHeading prefix={labelPrefix} highlight={labelHighlight} />
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                directionalLockEnabled
                canCancelContentTouches
                keyboardShouldPersistTaps="always"
                decelerationRate="normal"
                scrollEventThrottle={16}
                onScrollBeginDrag={handleScrollBegin}
                onMomentumScrollBegin={handleScrollBegin}
                onScrollEndDrag={handleScrollEnd}
                onMomentumScrollEnd={handleScrollEnd}
                contentContainerStyle={[styles.scrollContent, { flexDirection: 'row' }]}
            >
                {displayedVendors.map((vendor) => {
                    const name = isRTL
                        ? (vendor.nameAr || vendor.vendorNameAr || vendor.nameEn || vendor.vendorName || 'Vendor')
                        : (vendor.nameEn || vendor.vendorName || vendor.nameAr || vendor.vendorNameAr || 'Vendor');

                    return (
                        <RestaurantCard
                            key={vendor.id}
                            id={vendor.id}
                            name={name}
                            cashbackText={undefined}
                            imageUri={vendor.bannerImage || vendor.coverImage}
                            logoUri={vendor.vendorProfilePicture || vendor.profilePicture}
                            xcardEnabled={vendor.xcard}
                            nameStyle={styles.carouselName}
                            contentStyle={variant === 'newDeals' ? styles.newDealsCardContent : undefined}
                            onPress={() => handleVendorPress(vendor)}
                            style={{
                                width: offerCardWidth,
                                minHeight: variant === 'newDeals' ? 0 : undefined,
                            }}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: HOME_SECTION_TOP_SPACING,
    },
    newDealsContainer: {
        paddingTop: NEW_DEALS_TOP_SPACING,
    },
    newDealsCardContent: {
        paddingBottom: 0,
    },
    carouselName: {
        fontSize: 16,
        lineHeight: 20,
    },
    loaderContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: OFFER_SIDE_PADDING,
        gap: OFFER_CARD_GAP,
    },
});
