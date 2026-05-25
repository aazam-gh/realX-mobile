import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    I18nManager,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import PhonkText from '../PhonkText';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';

type BrandItem = {
    id: string;
    name: string;
    logoUrl: string;
    vendorId: string;
    isActive: boolean;
};

const BRAND_TILE_SIZE = 64;
const BRAND_TILE_GAP = 14;
const BRAND_ROW_SIDE_PADDING = 20;
const BRAND_SCROLL_SPEED = 18;
const BRAND_REPEAT_COUNT = 3;

function wrapOffset(offset: number, loopDistance: number) {
    if (loopDistance === 0) {
        return offset;
    }

    if (offset < loopDistance * 0.5) {
        return offset + loopDistance;
    }

    if (offset >= loopDistance * 1.5) {
        return offset - loopDistance;
    }

    return offset;
}

function InfiniteBrandRow({
    items,
    onPressBrand,
    direction,
}: {
    items: BrandItem[];
    onPressBrand: (brand: BrandItem) => void;
    direction: 1 | -1;
}) {
    const scrollRef = useRef<ScrollView | null>(null);
    const currentOffsetRef = useRef(0);
    const isDraggingRef = useRef(false);
    const isMomentumRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number | null>(null);
    const hasInitializedRef = useRef(false);
    const shouldLoop = items.length > 1;
    const loopDistance = useMemo(() => {
        if (items.length <= 1) {
            return 0;
        }

        const singleRunWidth =
            items.length * BRAND_TILE_SIZE +
            (items.length - 1) * BRAND_TILE_GAP +
            BRAND_ROW_SIDE_PADDING * 2;

        return singleRunWidth;
    }, [items.length]);

    useEffect(() => {
        if (!shouldLoop || loopDistance === 0) {
            hasInitializedRef.current = false;
            currentOffsetRef.current = 0;
            return;
        }

        hasInitializedRef.current = false;
        const id = requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ x: loopDistance, animated: false });
            currentOffsetRef.current = loopDistance;
            hasInitializedRef.current = true;
        });

        return () => cancelAnimationFrame(id);
    }, [loopDistance, shouldLoop, items.length]);

    useEffect(() => {
        if (!shouldLoop || loopDistance === 0) {
            return;
        }

        const tick = (timestamp: number) => {
            if (lastFrameTimeRef.current == null) {
                lastFrameTimeRef.current = timestamp;
            }

            const deltaMs = timestamp - lastFrameTimeRef.current;
            lastFrameTimeRef.current = timestamp;

            if (hasInitializedRef.current && !isDraggingRef.current && !isMomentumRef.current) {
                const deltaX = (direction * BRAND_SCROLL_SPEED * deltaMs) / 1000;
                const nextOffset = wrapOffset(currentOffsetRef.current + deltaX, loopDistance);

                if (nextOffset !== currentOffsetRef.current) {
                    currentOffsetRef.current = nextOffset;
                    scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
                }
            }

            animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current != null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            lastFrameTimeRef.current = null;
        };
    }, [direction, loopDistance, shouldLoop]);

    const renderBrand = (brand: BrandItem, keyPrefix: string) => (
        <Pressable
            key={`${keyPrefix}${brand.id}`}
            style={styles.brandItem}
            onPress={() => onPressBrand(brand)}
        >
            <Image
                source={{ uri: brand.logoUrl }}
                style={styles.imageContainer}
                contentFit="contain"
                cachePolicy="memory-disk"
            />
        </Pressable>
    );

    return (
        <View style={styles.rowViewport}>
            <ScrollView
                ref={scrollRef}
                horizontal
                style={styles.rowScroll}
                showsHorizontalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                nestedScrollEnabled
                directionalLockEnabled
                canCancelContentTouches
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                onScroll={(event) => {
                    const nextOffset = wrapOffset(event.nativeEvent.contentOffset.x, loopDistance);
                    currentOffsetRef.current = nextOffset;

                    if (nextOffset !== event.nativeEvent.contentOffset.x) {
                        scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
                    }
                }}
                onScrollBeginDrag={() => {
                    isDraggingRef.current = true;
                }}
                onScrollEndDrag={() => {
                    isDraggingRef.current = false;
                }}
                onMomentumScrollBegin={() => {
                    isMomentumRef.current = true;
                }}
                onMomentumScrollEnd={() => {
                    isMomentumRef.current = false;
                }}
                contentContainerStyle={styles.scrollContent}
            >
                {Array.from({ length: shouldLoop ? BRAND_REPEAT_COUNT : 1 }).map((_, repeatIndex) => (
                    <View key={`segment-${repeatIndex}`} style={styles.rowSegment}>
                        {items.map((brand, index) => renderBrand(brand, `${repeatIndex}-${index}-`))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

export default function BrandGrid() {
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const displayedBrands = useMemo(() => (isRTL ? [...brands].reverse() : brands), [brands, isRTL]);
    const brandLabelPrefix = t('brand_header_prefix');
    const brandLabelHighlight = t('brand_header_highlight');

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const db = getFirestore();
                const brandsDocRef = doc(db, 'cms', 'brand');
                const brandsSnap = await getDoc(brandsDocRef);

                if (brandsSnap.exists()) {
                    const data = brandsSnap.data();
                    const activeBrands = (data?.brands || [])
                        .filter((b: any) => b.isActive)
                        .map((b: any) => ({
                            id: b.id,
                            name: b.name,
                            logoUrl: b.logoUrl,
                            vendorId: b.vendorId,
                            isActive: b.isActive,
                        })) as BrandItem[];
                    setBrands(activeBrands);
                }
            } catch (error) {
                logger.error('Error fetching brands:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
    }, []);

    const handlePress = (brand: BrandItem) => {
        triggerSubtleHaptic();
        router.push(`/vendor/${brand.vendorId}`);
    };

    // Split brands into rows: ≤4 = 1 row, 5-8 = 2 rows, >8 = 2 scrollable rows
    const { row1, row2, isSingleRow } = useMemo(() => {
        const count = displayedBrands.length;
        if (count <= 4) {
            return { row1: displayedBrands, row2: [], isSingleRow: true };
        }
        if (count <= 8) {
            const mid = Math.ceil(count / 2);
            return {
                row1: displayedBrands.slice(0, mid),
                row2: displayedBrands.slice(mid),
                isSingleRow: false,
            };
        }
        // >8: evenly distribute across 2 scrollable rows
        const mid = Math.ceil(count / 2);
        return {
            row1: displayedBrands.slice(0, mid),
            row2: displayedBrands.slice(mid),
            isSingleRow: false,
        };
    }, [displayedBrands]);

    if (loading) {
        return (
            <View style={[ styles.loaderContainer]}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    }

    if (displayedBrands.length === 0) {
        return null;
    }

    return (
        <View>
            <View style={styles.headerContainer}>
                <View style={styles.headerTitle}>
                    <PhonkText style={[styles.shopByText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                        {brandLabelPrefix}
                    </PhonkText>
                    <PhonkText style={[styles.brandText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                        {brandLabelHighlight}
                    </PhonkText>
                </View>
            </View>
            <InfiniteBrandRow items={row1} onPressBrand={handlePress} direction={1} />
            {!isSingleRow && (
                <View style={styles.rowSpacing}>
                    <InfiniteBrandRow items={row2} onPressBrand={handlePress} direction={-1} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shopByText: {
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    brandText: {
        fontSize: 20,
        color: Colors.brandGreen,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    loaderContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowViewport: {
        width: '100%',
        height: BRAND_TILE_SIZE,
        overflow: 'hidden',
    },
    rowScroll: {
        flex: 1,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowSegment: {
        flexDirection: 'row',
        gap: BRAND_TILE_GAP,
        paddingHorizontal: BRAND_ROW_SIDE_PADDING,
    },
    rowSpacing: {
        marginTop: 18,
    },
    brandItem: {
        alignItems: 'center',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 14,
        backgroundColor: 'transparent',
    },
});
