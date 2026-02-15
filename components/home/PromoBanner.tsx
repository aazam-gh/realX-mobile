import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_WIDTH = screenWidth - 40;
const BANNER_HEIGHT = 200;

type BannerItem = {
    bannerId: string;
    altText: string;
    images: {
        desktop?: string;
        mobile?: string;
    };
    isActive: boolean;
    offerId: string;
    lastUpdated?: string;
};

export default function PromoBanner() {
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const db = getFirestore();
                const cmsDocRef = doc(db, 'cms', 'banner');
                const cmsSnap = await getDoc(cmsDocRef);

                if (cmsSnap.exists()) {
                    const data = cmsSnap.data();
                    if (data && data.banners) {
                        const activeBanners = data.banners.filter((b: any) => b.isActive);
                        setBanners(activeBanners);
                    } else {
                        setBanners([]);
                    }
                } else {
                    setBanners([]);
                }
            } catch (error) {
                console.error('Error fetching banners:', error);
                setBanners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (BANNER_WIDTH + 10));
        setActiveIndex(index);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="large" color="#333" />
            </View>
        );
    }

    if (banners.length === 0) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <Text style={{ color: '#888' }}>No banners available</Text>
            </View>
        );
    }

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
                    <View key={banner.bannerId} style={styles.bannerColumn}>
                        {/* --- TOP PILL (Mobile Image) --- */}
                        {banner.images.mobile ? (
                            <View style={styles.topPill}>
                                <Image
                                    source={{ uri: banner.images.mobile }}
                                    style={styles.bannerImage}
                                    contentFit="contain"
                                    accessibilityLabel={banner.altText || 'Banner Image'}
                                />
                            </View>
                        ) : (
                            <View style={[styles.topPill, styles.placeholder]}>
                                <Text style={styles.placeholderText}>No mobile image</Text>
                            </View>
                        )}

                        {/* --- BOTTOM PILL (Desktop Image) --- */}
                        {banner.images.desktop ? (
                            <View style={styles.bottomPill}>
                                <Image
                                    source={{ uri: banner.images.desktop }}
                                    style={styles.bannerImage}
                                    contentFit="contain"
                                    accessibilityLabel={banner.altText || 'Banner Image'}
                                />
                            </View>
                        ) : (
                            <View style={[styles.bottomPill, styles.placeholder]}>
                                <Text style={styles.placeholderText}>No desktop image</Text>
                            </View>
                        )}

                        {/* --- CUTOUTS --- */}
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
    loaderContainer: {
        height: BANNER_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    bannerColumn: {
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        position: 'relative',
        justifyContent: 'center',
    },

    // --- PILL STYLES ---
    topPill: {
        flex: 1.0,
        borderRadius: 30,
        backgroundColor: '#F5F5F5',

    },
    bottomPill: {
        flex: 1.0,
        borderRadius: 30,
        backgroundColor: '#F5F5F5',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },

    // --- Placeholder styles ---
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
    },
    placeholderText: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // --- CUTOUTS ---
    leftCutout: {
        position: 'absolute',
        top: '50%',
        backgroundColor: '#FFFFFF',
        zIndex: 10,
    },
    rightCutout: {
        position: 'absolute',
        top: '50%',
        backgroundColor: '#FFFFFF',
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
