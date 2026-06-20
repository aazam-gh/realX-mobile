import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    I18nManager,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import type { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '../../context/AppThemeContext';
import { fetchCmsDocument } from '../../utils/firebaseQueries';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { logger } from '../../utils/logger';
import { queryKeys } from '../../utils/queryClient';

const BANNER_HEIGHT = 192;
const BANNER_SIDE_PADDING = 24;
const BANNER_GAP = 12;
const BANNER_AUTO_SCROLL_MS = 4000;
const TRACK_HEIGHT = 6;
const TRACK_TOUCH_HEIGHT = 28;
const THUMB_SIZE = 18;

const SPRING_CONFIG = {
    damping: 18,
    stiffness: 180,
    mass: 0.7,
};

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
    const isSliderDraggingRef = useRef(false);
    const sliderProgress = useSharedValue(0);
    const isSliderDragging = useSharedValue(false);
    const { width: screenWidth } = useWindowDimensions();
    const router = useRouter();
    const bannerWidth = screenWidth - (BANNER_SIDE_PADDING * 2);
    const bannerScrollInterval = bannerWidth + BANNER_GAP;
    const hasMultipleBanners = banners.length > 1;
    const maxIndex = Math.max(0, banners.length - 1);
    const safeCurrentIndex = Math.min(currentIndex, maxIndex);
    const sliderUsableWidth = Math.max(0, bannerWidth - THUMB_SIZE);
    const isRTL = I18nManager.isRTL;

    useEffect(() => {
        if (error) logger.error('Error fetching banners:', error);
    }, [error]);

    useEffect(() => {
        if (!hasMultipleBanners) {
            sliderProgress.value = 0;
            return;
        }

        if (isSliderDraggingRef.current) {
            return;
        }

        const nextProgress = maxIndex === 0 ? 0 : safeCurrentIndex / maxIndex;
        sliderProgress.value = withSpring(nextProgress, SPRING_CONFIG);
    }, [hasMultipleBanners, maxIndex, safeCurrentIndex, sliderProgress]);

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

    const getLogicalProgressFromTouchX = (touchX: number) => {
        if (!hasMultipleBanners || sliderUsableWidth === 0) {
            return 0;
        }

        const clampedTouchX = Math.max(0, Math.min(bannerWidth, touchX));
        const rawProgress = Math.max(
            0,
            Math.min(1, (clampedTouchX - THUMB_SIZE / 2) / sliderUsableWidth),
        );

        return isRTL ? 1 - rawProgress : rawProgress;
    };

    const setSliderFromTouch = (touchX: number) => {
        const nextProgress = getLogicalProgressFromTouchX(touchX);
        sliderProgress.value = nextProgress;
        return nextProgress;
    };

    const commitSliderProgress = (nextProgress: number) => {
        if (!hasMultipleBanners) {
            return;
        }

        const committedProgress = Math.max(0, Math.min(1, nextProgress));
        const nextIndex = Math.round(committedProgress * maxIndex);

        isSliderDraggingRef.current = false;
        isSliderDragging.value = false;
        isUserInteractingRef.current = false;
        setCurrentIndex(nextIndex);
    };

    const handleSliderChange = (event: GestureResponderEvent) => {
        if (!hasMultipleBanners) {
            return;
        }

        isSliderDraggingRef.current = true;
        isSliderDragging.value = true;
        isUserInteractingRef.current = true;
        setSliderFromTouch(event.nativeEvent.locationX);
    };

    const handleSliderRelease = (event: GestureResponderEvent) => {
        if (!hasMultipleBanners) {
            return;
        }

        const nextProgress = setSliderFromTouch(event.nativeEvent.locationX);
        sliderProgress.value = withSpring(nextProgress, SPRING_CONFIG);
        commitSliderProgress(nextProgress);
    };

    const handleSliderAccessibilityAction = (action: 'increment' | 'decrement') => {
        if (!hasMultipleBanners) {
            return;
        }

        const delta = action === 'increment' ? 1 : -1;
        const nextIndex = Math.max(0, Math.min(maxIndex, safeCurrentIndex + delta));

        isSliderDraggingRef.current = false;
        isSliderDragging.value = false;
        isUserInteractingRef.current = false;
        sliderProgress.value = withSpring(maxIndex === 0 ? 0 : nextIndex / maxIndex, SPRING_CONFIG);
        setCurrentIndex(nextIndex);
    };

    const handleScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            if (isSliderDragging.value) {
                return;
            }

            if (!hasMultipleBanners || maxIndex === 0) {
                sliderProgress.value = 0;
                return;
            }

            const progress = Math.max(
                0,
                Math.min(1, event.contentOffset.x / (bannerScrollInterval * maxIndex)),
            );

            sliderProgress.value = isRTL ? 1 - progress : progress;
        },
    });

    const sliderDisplayProgress = useAnimatedStyle(() => {
        const progress = isRTL ? 1 - sliderProgress.value : sliderProgress.value;

        return {
            transform: [{ translateX: progress * sliderUsableWidth }],
        };
    });

    const sliderFillStyle = useAnimatedStyle(() => {
        const progress = isRTL ? 1 - sliderProgress.value : sliderProgress.value;

        return {
            width: THUMB_SIZE / 2 + (progress * sliderUsableWidth),
        };
    });

    const sliderPanResponder = hasMultipleBanners
        ? PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: handleSliderChange,
            onPanResponderMove: handleSliderChange,
            onPanResponderRelease: handleSliderRelease,
            onPanResponderTerminate: handleSliderRelease,
            onPanResponderTerminationRequest: () => false,
        })
        : null;

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

    if (banners.length === 0) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <Text style={{ color: theme.subtleText, fontFamily: 'System' }}>No banners available</Text>
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
                snapToInterval={bannerScrollInterval}
                decelerationRate="fast"
                disableIntervalMomentum
                scrollEventThrottle={16}
                onScroll={handleScroll}
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

            {hasMultipleBanners ? (
                <View
                    style={[styles.sliderContainer, { width: bannerWidth }]}
                    accessible
                    accessibilityRole="adjustable"
                    accessibilityLabel="Promo banner slider"
                    accessibilityHint="Swipe up or down to change the featured banner"
                    accessibilityValue={{
                        min: 1,
                        max: banners.length,
                        now: safeCurrentIndex + 1,
                    }}
                    accessibilityActions={[
                        { name: 'increment', label: 'Next banner' },
                        { name: 'decrement', label: 'Previous banner' },
                    ]}
                    onAccessibilityAction={({ nativeEvent }) => {
                        if (nativeEvent.actionName === 'increment') {
                            handleSliderAccessibilityAction('increment');
                        }

                        if (nativeEvent.actionName === 'decrement') {
                            handleSliderAccessibilityAction('decrement');
                        }
                    }}
                    {...sliderPanResponder?.panHandlers}
                >
                    <View
                        style={[
                            styles.sliderRail,
                            {
                                backgroundColor: theme.border,
                            },
                        ]}
                    />

                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.sliderFill,
                            isRTL ? styles.sliderFillRTL : styles.sliderFillLTR,
                            {
                                backgroundColor: theme.brand,
                            },
                            sliderFillStyle,
                        ]}
                    />

                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.sliderThumb,
                            {
                                backgroundColor: theme.onActionSolid,
                                borderColor: theme.brand,
                            },
                            sliderDisplayProgress,
                        ]}
                    />
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    sliderContainer: {
        marginTop: 12,
        height: TRACK_TOUCH_HEIGHT,
        alignSelf: 'center',
        justifyContent: 'center',
    },
    sliderRail: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: (TRACK_TOUCH_HEIGHT - TRACK_HEIGHT) / 2,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
    },
    sliderFill: {
        position: 'absolute',
        top: (TRACK_TOUCH_HEIGHT - TRACK_HEIGHT) / 2,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
    },
    sliderFillLTR: {
        left: 0,
    },
    sliderFillRTL: {
        right: 0,
    },
    sliderThumb: {
        position: 'absolute',
        top: (TRACK_TOUCH_HEIGHT - THUMB_SIZE) / 2,
        left: 0,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        borderWidth: 2,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.16)',
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
