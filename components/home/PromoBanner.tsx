import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Typography } from '../../constants/Typography';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 40;
const BANNER_HEIGHT = 220; // Increased slightly to accommodate the split view

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
                    <View key={banner.id} style={styles.bannerColumn}>
                        
                        {/* --- TOP PILL (Text & Logo) --- */}
                        <View style={[styles.topPill, { backgroundColor: banner.backgroundColor }]}>
                            <View style={styles.patternOverlay} />
                            
                            <View style={styles.topContentRow}>
                                <View style={styles.textContainer}>
                                    <Text style={styles.discountText}>{banner.discount}</Text>
                                    <Text style={styles.titleText}>{banner.title}</Text>
                                </View>

                                <View style={styles.brandLogoPlaceholder}>
                                    <Text style={styles.brandLogoText}>LOGO</Text>
                                </View>
                            </View>
                        </View>

                        {/* --- BOTTOM PILL (Images) --- */}
                        <View style={[styles.bottomPill, { backgroundColor: banner.backgroundColor }]}>
                            <View style={styles.patternOverlay} />

                            <View style={styles.bottomContentRow}>
                                {/* Food image placeholder (Left) */}
                                <View style={styles.foodImagePlaceholder}>
                                    <Text style={styles.foodEmoji}>🍽️</Text>
                                </View>

                                {/* Mascot placeholder (Right) */}
                                <View style={styles.mascotPlaceholder}>
                                    <Text style={styles.mascotEmoji}>🙂</Text>
                                </View>
                            </View>
                        </View>

                        {/* --- CUTOUTS (The "Bite" between pills) --- */}
                        {/* Located absolutely relative to the column to bridge the gap */}
                        <View style={styles.leftCutout} />
                        <View style={styles.rightCutout} />

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

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    bannerColumn: {
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        position: 'relative',
        justifyContent: 'center', // Centers the pills vertically
    },
    
    // --- PILL STYLES ---
    topPill: {
        flex: 0.8, // Takes up about 45% of height
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        padding: 20,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    bottomPill: {
        flex: 1.2, // Takes up about 55% of height
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)', // Subtle pattern effect
        zIndex: 0,
    },

    // --- TEXT & LOGO CONTENT (Top Pill) ---
    topContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
    },
    textContainer: {
        flex: 1,
        paddingRight: 10,
    },
    discountText: {
        fontSize: 24, // Increased size
        fontFamily: Typography.metropolis.semiBold,
        fontStyle: 'italic', // Added italic per reference
        color: '#FFFFFF',
        marginBottom: 0,
        lineHeight: 28,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    titleText: {
        fontSize: 24, // Increased size
        fontFamily: Typography.metropolis.semiBold,
        fontWeight: '900', // Make it extra bold
        color: '#FFFFFF',
        lineHeight: 28,
        textTransform: 'uppercase',
    },
    brandLogoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    brandLogoText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FF6B35',
    },

    // --- IMAGES CONTENT (Bottom Pill) ---
    bottomContentRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end', // Align items to the bottom of the pill
        paddingBottom: 10,
        zIndex: 1,
    },
    foodImagePlaceholder: {
        width: 120,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        // In a real app, you might apply some rotation or styling here
    },
    foodEmoji: {
        fontSize: 70,
    },
    mascotPlaceholder: {
        width: 90,
        height: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    mascotEmoji: {
        fontSize: 80,
    },

    // --- CUTOUTS ---
    leftCutout: {
        position: 'absolute',
        top: '50%', // Centers vertically relative to the whole banner column
        backgroundColor: '#FFFFFF', // Matches screen background
        zIndex: 10,
    },
    rightCutout: {
        position: 'absolute',
        top: '50%',
        backgroundColor: '#FFFFFF', // Matches screen background
        zIndex: 10,
    },

    // --- PAGINATION ---
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 4,
    },
    paginationDot: {
        width: 28,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
    },
    paginationDotActive: {
        backgroundColor: '#333333',
        width: 96,
    },
});