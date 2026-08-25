import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import {
    homeQueryOptions,
    isValidHomeFeaturedBanner,
    type HomeFeaturedBannerItem,
} from '../../utils/homeQueries';
import { HOME_COMPACT_BANNER_HEIGHT, HOME_SECTION_TOP_SPACING } from './layout';
import FeaturedBanner from './FeaturedBanner';
import WaktiBanner from './WaktiBanner';

const FADE_DURATION_MS = 500;
const DISPLAY_DURATION_MS = 5000;

export default function HomeBannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeProgress = useRef(new Animated.Value(0)).current;
    const {
        data: featuredBanner = null,
    } = useQuery({
        ...homeQueryOptions.featuredBanner(),
    });

    const hasFeaturedBanner = isValidHomeFeaturedBanner(featuredBanner);

    useEffect(() => {
        if (!hasFeaturedBanner) {
            setCurrentIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentIndex((index) => (index + 1) % 2);
        }, DISPLAY_DURATION_MS);

        return () => clearInterval(interval);
    }, [hasFeaturedBanner]);

    useEffect(() => {
        Animated.timing(fadeProgress, {
            toValue: currentIndex,
            duration: FADE_DURATION_MS,
            useNativeDriver: true,
        }).start();
    }, [currentIndex, fadeProgress]);

    const waktiOpacity = fadeProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });
    const featuredOpacity = fadeProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <View style={styles.container} accessibilityLabel="Home promotional banners">
            <Animated.View style={[styles.layer, { opacity: waktiOpacity }]} pointerEvents={currentIndex === 0 ? 'auto' : 'none'}>
                <WaktiBanner />
            </Animated.View>
            {hasFeaturedBanner ? (
                <Animated.View style={[styles.layer, { opacity: featuredOpacity }]} pointerEvents={currentIndex === 1 ? 'auto' : 'none'}>
                    <FeaturedBanner item={featuredBanner as HomeFeaturedBannerItem} />
                </Animated.View>
            ) : null}
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
