import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import {
    homeQueryOptions,
    type HomeFeaturedBannerItem,
} from '../../utils/homeQueries';
import { HOME_COMPACT_BANNER_HEIGHT, HOME_SECTION_TOP_SPACING } from './layout';
import FeaturedBanner from './FeaturedBanner';

const FADE_DURATION_MS = 500;
const DISPLAY_DURATION_MS = 5000;

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
    );
}

const styles = StyleSheet.create({
    container: {
        height: HOME_SECTION_TOP_SPACING + HOME_COMPACT_BANNER_HEIGHT,
        position: 'relative',
    },
    layer: {
        ...StyleSheet.absoluteFill,
    },
});
