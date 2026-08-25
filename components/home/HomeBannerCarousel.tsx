import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import {
    homeQueryOptions,
    type HomeFeaturedBannerItem,
} from '../../utils/homeQueries';
import { HOME_COMPACT_BANNER_HEIGHT, HOME_SECTION_TOP_SPACING } from './layout';
import FeaturedBanner from './FeaturedBanner';

const FADE_DURATION_MS = 500;
const DISPLAY_DURATION_MS = 5000;
const PAGINATION_HEIGHT = 24;

export default function HomeBannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeProgress = useRef(new Animated.Value(0)).current;
    const {
        data: featuredBannerData = [],
    } = useQuery({
        ...homeQueryOptions.featuredBanner(),
    });
    const featuredBanners = Array.isArray(featuredBannerData)
        ? featuredBannerData
        : featuredBannerData
            ? [featuredBannerData]
            : [];

    const slideCount = featuredBanners.length;

    useEffect(() => {
        if (slideCount <= 1) {
            setCurrentIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentIndex((index) => (index + 1) % slideCount);
        }, DISPLAY_DURATION_MS);

        return () => clearInterval(interval);
    }, [slideCount]);

    useEffect(() => {
        if (slideCount === 0) {
            setCurrentIndex(0);
            return;
        }

        setCurrentIndex((index) => Math.min(index, slideCount - 1));
    }, [slideCount]);

    useEffect(() => {
        Animated.timing(fadeProgress, {
            toValue: currentIndex,
            duration: FADE_DURATION_MS,
            useNativeDriver: true,
        }).start();
    }, [currentIndex, fadeProgress]);

    const getSlideOpacity = (slideIndex: number) => fadeProgress.interpolate({
        inputRange: [slideIndex - 1, slideIndex, slideIndex + 1],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
    });

    if (featuredBanners.length === 0) {
        return null;
    }

    return (
        <View style={styles.container} accessibilityLabel="Home promotional banners">
            <View style={styles.stage}>
                {featuredBanners.map((featuredBanner, index) => (
                    <Animated.View
                        key={featuredBanner.id}
                        style={[styles.layer, { opacity: getSlideOpacity(index) }]}
                        pointerEvents={currentIndex === index ? 'auto' : 'none'}
                    >
                        <FeaturedBanner item={featuredBanner as HomeFeaturedBannerItem} />
                    </Animated.View>
                ))}
            </View>
            {slideCount > 1 ? (
                <View style={styles.pagination} accessibilityLabel="Featured banner navigation">
                    {featuredBanners.map((featuredBanner, index) => (
                        <Pressable
                            key={`dot-${featuredBanner.id}`}
                            onPress={() => setCurrentIndex(index)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={`Show featured banner ${index + 1}`}
                            accessibilityState={{ selected: currentIndex === index }}
                        >
                            <View style={[styles.dot, currentIndex === index && styles.activeDot]} />
                        </Pressable>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: HOME_SECTION_TOP_SPACING + HOME_COMPACT_BANNER_HEIGHT + PAGINATION_HEIGHT,
        position: 'relative',
    },
    stage: {
        height: HOME_SECTION_TOP_SPACING + HOME_COMPACT_BANNER_HEIGHT,
        position: 'relative',
    },
    layer: {
        ...StyleSheet.absoluteFill,
    },
    pagination: {
        height: PAGINATION_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        backgroundColor: '#D6D9D7',
    },
    activeDot: {
        width: 20,
        backgroundColor: '#18B852',
    },
});
