import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

import { useAppTheme } from '../../context/AppThemeContext';
import { StateSurface } from '../StateSurface';
import { fetchCmsDocument } from '../../utils/firebaseQueries';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { logger } from '../../utils/logger';
import { queryKeys } from '../../utils/queryClient';
import { HOME_CAROUSEL_GAP, HOME_HORIZONTAL_GUTTER } from './layout';

const BANNER_HEIGHT = 192;
const BANNER_SIDE_PADDING = HOME_HORIZONTAL_GUTTER;
const BANNER_GAP = HOME_CAROUSEL_GAP;
const BANNER_AUTO_SCROLL_MS = 4000;
const INDICATOR_WIDTH = 88;
const INDICATOR_THUMB_WIDTH = 24;

export type BannerItem = {
    bannerId: string;
    altText: string;
    id?: string;
    images: {
        desktop?: string;
        mobile?: string;
    };
    isActive: boolean;
    vendorId?: string;
    lastUpdated?: string;
};

type PromoBannerProps = {
    onBannerPress?: (banner: BannerItem) => void;
};

export default function PromoBanner({ onBannerPress }: PromoBannerProps) {
    const { theme } = useAppTheme();
    const {
        data: banners = [],
        error,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: queryKeys.cmsDocument('banner'),
        queryFn: async () => {
            const data = await fetchCmsDocument<{ banners?: BannerItem[] }>('banner');
            return (data?.banners || []).filter((banner: BannerItem) => banner.isActive);
        },
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<Animated.ScrollView | null>(null);
    const isUserInteractingRef = useRef(false);
    const { width: screenWidth } = useWindowDimensions();
    const router = useRouter();
    const bannerWidth = screenWidth - (BANNER_SIDE_PADDING * 2);
    const bannerScrollInterval = bannerWidth + BANNER_GAP;
    const maxIndex = Math.max(0, banners.length - 1);
    const scrollProgress = useSharedValue(0);
    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollProgress.value = event.contentOffset.x / bannerScrollInterval;
        },
    });
    const indicatorThumbStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX: interpolate(
                    scrollProgress.value,
                    [0, Math.max(1, maxIndex)],
                    [0, INDICATOR_WIDTH - INDICATOR_THUMB_WIDTH],
                ),
            },
        ],
    }));

    useEffect(() => {
        if (error) logger.error('Error fetching banners:', error);
    }, [error]);

    useEffect(() => {
        if (banners.length <= 1) {
            return;
        }

        const interval = setInterval(() => {
            if (isUserInteractingRef.current) {
                return;
            }

            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, BANNER_AUTO_SCROLL_MS);

        return () => clearInterval(interval);
    }, [banners.length]);

    useEffect(() => {
        if (!scrollViewRef.current || banners.length === 0) {
            return;
        }

        const safeIndex = Math.min(currentIndex, maxIndex);

        scrollViewRef.current.scrollTo({
            x: safeIndex * bannerScrollInterval,
            animated: true,
        });
    }, [bannerScrollInterval, banners.length, currentIndex, maxIndex]);

    const getBannerVendorId = (banner: BannerItem) => {
        const vendorId = banner.vendorId?.trim() || banner.id?.trim();
        return vendorId || null;
    };

    const handleScrollBegin = () => {
        isUserInteractingRef.current = true;
    };

    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (banners.length <= 1) {
            isUserInteractingRef.current = false;
            return;
        }

        const nextIndex = Math.min(
            maxIndex,
            Math.max(0, Math.round(event.nativeEvent.contentOffset.x / bannerScrollInterval)),
        );

        setCurrentIndex((prevIndex) => (prevIndex === nextIndex ? prevIndex : nextIndex));
        isUserInteractingRef.current = false;
    };

    const handlePress = (banner: BannerItem) => {
        const vendorId = getBannerVendorId(banner);

        if (!vendorId) {
            logger.warn('Promo banner is missing a linked vendorId:', banner.bannerId);
            return;
        }

        triggerSubtleHaptic();
        if (onBannerPress) {
            onBannerPress({ ...banner, vendorId });
        } else {
            router.push({ pathname: '/vendor/[id]', params: { id: vendorId } });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="large" color={theme.brand} />
            </View>
        );
    }

    if (error && banners.length === 0) {
        return <StateSurface kind="error" compact onRetry={() => void refetch()} />;
    }

    if (banners.length === 0) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <StateSurface kind="empty" compact />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                style={styles.carousel}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                directionalLockEnabled
                canCancelContentTouches
                keyboardShouldPersistTaps="always"
                onScroll={handleScroll}
                snapToInterval={bannerScrollInterval}
                decelerationRate="fast"
                disableIntervalMomentum
                scrollEventThrottle={16}
                onScrollBeginDrag={handleScrollBegin}
                onMomentumScrollBegin={handleScrollBegin}
                onScrollEndDrag={handleScrollEnd}
                onMomentumScrollEnd={handleScrollEnd}
                contentContainerStyle={styles.scrollContent}
            >
                {banners.map((banner, index) => {
                    const imageUri = banner.images.mobile || banner.images.desktop;

                    return (
                        <Pressable
                            key={banner.bannerId || banner.vendorId || banner.id || index}
                            style={({ pressed }) => [
                                styles.bannerColumn,
                                { width: bannerWidth },
                                pressed && styles.bannerPressed,
                            ]}
                            onPress={() => handlePress(banner)}
                            accessibilityRole="button"
                            accessibilityLabel={banner.altText || 'Open vendor'}
                        >
                            <View style={styles.topPill}>
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.topImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                    accessibilityLabel={banner.altText || 'Banner Image'}
                                />
                            </View>

                            <View style={styles.bottomPill}>
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.bottomImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                    accessibilityLabel={banner.altText || 'Banner Image'}
                                />
                            </View>
                        </Pressable>
                    );
                })}
            </Animated.ScrollView>

            {banners.length > 1 && (
                <View
                    style={styles.indicator}
                    accessibilityRole="adjustable"
                    accessibilityLabel={`Banner ${currentIndex + 1} of ${banners.length}`}
                >
                    <View style={[styles.indicatorTrack, { backgroundColor: theme.cardMuted }]}>
                        {banners.map((banner, index) => (
                            <Pressable
                                key={banner.bannerId || banner.vendorId || banner.id || index}
                                style={styles.indicatorSegment}
                                onPress={() => setCurrentIndex(index)}
                                accessibilityRole="button"
                                accessibilityLabel={`Show banner ${index + 1} of ${banners.length}`}
                                accessibilityState={{ selected: currentIndex === index }}
                            />
                        ))}
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.indicatorThumb,
                                { backgroundColor: theme.brand },
                                indicatorThumbStyle,
                            ]}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    loaderContainer: {
        height: BANNER_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    carousel: {
        height: BANNER_HEIGHT,
    },
    scrollContent: {
        paddingHorizontal: BANNER_SIDE_PADDING,
        gap: BANNER_GAP,
    },
    bannerColumn: {
        height: BANNER_HEIGHT,
    },
    bannerPressed: {
        opacity: 0.9,
    },
    indicator: {
        alignItems: 'center',
        paddingTop: 10,
    },
    indicatorTrack: {
        width: INDICATOR_WIDTH,
        height: 6,
        borderRadius: 3,
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
    },
    indicatorSegment: {
        flex: 1,
        zIndex: 1,
    },
    indicatorThumb: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: INDICATOR_THUMB_WIDTH,
        height: 6,
        borderRadius: 3,
    },
    topPill: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    bottomPill: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    topImage: {
        width: '100%',
        height: '200%',
    },
    bottomImage: {
        width: '100%',
        height: '200%',
        transform: [{ translateY: '-50%' }],
    },
});
