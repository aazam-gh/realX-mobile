import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Typography } from '../../constants/Typography';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 40;

type BannerItem = {
    id: string;
    title: string;
    discount: string;
    backgroundColor: string;
};

type Props = {
    banners?: BannerItem[];
};

const defaultBanners: BannerItem[] = [
    {
        id: '1',
        title: 'POORI & KARAK',
        discount: '20% DISCOUNT',
        backgroundColor: '#FF6B35',
    },
    {
        id: '2',
        title: 'COFFEE HOUSE',
        discount: '15% OFF',
        backgroundColor: '#4A90D9',
    },
    {
        id: '3',
        title: 'GROCERY MART',
        discount: 'BUY 1 GET 1',
        backgroundColor: '#6B8E23',
    },
];

export default function PromoBanner({ banners = defaultBanners }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (BANNER_WIDTH + 10));
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={BANNER_WIDTH + 10}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {banners.map((banner) => (
                    <View
                        key={banner.id}
                        style={[styles.bannerCard, { backgroundColor: banner.backgroundColor }]}
                    >

                        {/* Left Inward Curve */}
                        <View style={styles.leftCutout} />

                        {/* Right Inward Curve */}
                        <View style={styles.rightCutout} />
                        {/* Background pattern overlay */}
                        <View style={styles.patternOverlay} />

                        {/* Main content */}
                        <View style={styles.bannerContent}>
                            <Text style={styles.discountText}>{banner.discount}</Text>
                            <Text style={styles.titleText}>{banner.title}</Text>
                        </View>

                        {/* Food image placeholder */}
                        <View style={styles.foodImageContainer}>
                            <View style={styles.foodImagePlaceholder}>
                                <Text style={styles.foodEmoji}>🍽️</Text>
                            </View>
                        </View>

                        {/* Brand logo placeholder (top right) */}
                        <View style={styles.brandLogoContainer}>
                            <View style={styles.brandLogoPlaceholder}>
                                <Text style={styles.brandLogoText}>LOGO</Text>
                            </View>
                        </View>

                        {/* Mascot placeholder (right side) */}
                        <View style={styles.mascotContainer}>
                            <View style={styles.mascotPlaceholder}>
                                <Text style={styles.mascotEmoji}>🙂</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Pagination dots */}
            <View style={styles.paginationContainer}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === activeIndex && styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const CUTOUT_SIZE = 40; // Adjust this to make the "bite" bigger or smaller

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    bannerCard: {
        width: BANNER_WIDTH,
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
leftCutout: {
        position: 'absolute',
        left: -(CUTOUT_SIZE / 2), // Move half the circle outside the banner
        top: '50%',
        marginTop: -(CUTOUT_SIZE / 2), // Center it vertically
        width: CUTOUT_SIZE,
        height: CUTOUT_SIZE,
        borderRadius: CUTOUT_SIZE / 2,
        backgroundColor: '#FFFFFF', // This must match your screen's background color
        zIndex: 10,
    },
    rightCutout: {
        position: 'absolute',
        right: -(CUTOUT_SIZE / 2), // Move half the circle outside the banner
        top: '50%',
        marginTop: -(CUTOUT_SIZE / 2), // Center it vertically
        width: CUTOUT_SIZE,
        height: CUTOUT_SIZE,
        borderRadius: CUTOUT_SIZE / 2,
        backgroundColor: '#FFFFFF', // This must match your screen's background color
        zIndex: 10,
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
    },
    bannerContent: {
        position: 'absolute',
        top: 24,
        left: 20,
        zIndex: 2,
    },
    discountText: {
        fontSize: 26,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    titleText: {
        fontSize: 22,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    foodImageContainer: {
        position: 'absolute',
        bottom: 0,
        left: 10,
        right: 100,
        height: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    foodImagePlaceholder: {
        width: 150,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmoji: {
        fontSize: 60,
    },
    brandLogoContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    brandLogoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandLogoText: {
        fontSize: 8,
        fontFamily: Typography.metropolis.semiBold,
        color: '#333',
    },
    mascotContainer: {
        position: 'absolute',
        right: 16,
        bottom: 20,
    },
    mascotPlaceholder: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mascotEmoji: {
        fontSize: 50,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    paginationDot: {
        width: 28,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E0E0E0',
    },
    paginationDotActive: {
        backgroundColor: '#333333',
        width: 36,
    },
});
