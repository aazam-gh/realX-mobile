import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { homeQueryOptions, type HomeCategoryItem } from '../../utils/homeQueries';
import { logger } from '../../utils/logger';
import { HOME_HORIZONTAL_GUTTER } from './layout';
import { RemoteImage } from '../RemoteImage';
import { StateSurface } from '../StateSurface';

type CategoryItem = HomeCategoryItem;

type Props = {
    categories?: CategoryItem[];
    onCategoryPress?: (category: CategoryItem) => void;
};

const MAX_VISIBLE_CATEGORIES = 7;

export default function CategoryGrid({ categories: propCategories, onCategoryPress }: Props) {
    const router = useRouter();
    const { height, width } = useWindowDimensions();
    const { t } = useTranslation();
    const { locale } = useAppLocale();
    const { theme } = useAppTheme();
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const drawerTranslateY = useRef(new Animated.Value(height)).current;
    const moreAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const moreScale = useSharedValue(1);
    const moreRotation = useSharedValue(0);
    const reduceMotion = useReducedMotion();

    const moreIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: moreScale.value },
            { rotate: `${moreRotation.value}deg` },
        ],
    }));

    const isArabic = locale === 'ar';

    const {
        data: fetchedCategories = [],
        error,
        isLoading,
        refetch,
    } = useQuery({
        ...homeQueryOptions.categories(isArabic ? 'ar' : 'en'),
        enabled: !propCategories,
    });

    useEffect(() => {
        if (error) logger.error('Error fetching categories:', error);
    }, [error]);

    const baseCategories = propCategories || fetchedCategories;
    const visibleCategories = baseCategories.slice(0, MAX_VISIBLE_CATEGORIES);
    const remainingCategories = baseCategories.slice(MAX_VISIBLE_CATEGORIES);
    const hasMoreCategories = remainingCategories.length > 0;
    const comingSoonItem: CategoryItem = {
        id: 'coming-soon',
        name: t('more'),
    };
    const displayCategories = hasMoreCategories ? [...visibleCategories, comingSoonItem] : baseCategories;
    const categoryColumnWidth = (width - (HOME_HORIZONTAL_GUTTER * 2)) / 4;
    const categoryImageSize = Math.min(76, Math.max(68, categoryColumnWidth - 14));
    const categoryRowHeight = categoryImageSize + 36;

    useEffect(() => {
        if (isDrawerVisible) {
            drawerTranslateY.setValue(height);
            Animated.timing(drawerTranslateY, {
                toValue: 0,
                duration: 240,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
    }, [drawerTranslateY, height, isDrawerVisible]);

    useEffect(() => () => {
        if (moreAnimationTimer.current) clearTimeout(moreAnimationTimer.current);
    }, []);

    const closeDrawer = () => {
        Animated.timing(drawerTranslateY, {
            toValue: height,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) setIsDrawerVisible(false);
        });
    };

    const handleCategoryPress = (item: CategoryItem) => {
        triggerSubtleHaptic();
        if (item.id === 'coming-soon') {
            if (hasMoreCategories) {
                if (moreAnimationTimer.current) clearTimeout(moreAnimationTimer.current);

                if (reduceMotion) {
                    setIsDrawerVisible(true);
                } else {
                    moreScale.value = withSequence(
                        withTiming(0.86, { duration: 80 }),
                        withSpring(1, { damping: 12, stiffness: 260, mass: 0.7 }),
                    );
                    moreRotation.value = withSequence(
                        withTiming(-8, { duration: 80 }),
                        withTiming(8, { duration: 80 }),
                        withSpring(0, { damping: 12, stiffness: 260, mass: 0.7 }),
                    );
                    moreAnimationTimer.current = setTimeout(() => {
                        setIsDrawerVisible(true);
                        moreAnimationTimer.current = null;
                    }, 150);
                }
            }
            return;
        }

        if (onCategoryPress) {
            onCategoryPress(item);
        } else {
            router.push({
                pathname: "/category/[id]",
                params: { id: item.id, name: item.name, englishName: item.englishName || item.name }
            });
        }
    };

    const renderCategory = ({ item }: { item: CategoryItem }) => {
        return (
            <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={item.name}
            >
                <View
                    style={[
                        styles.imageContainer,
                        {
                            width: categoryImageSize,
                            height: categoryImageSize,
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                        },
                    ]}
                >
                    {item.id === 'coming-soon' ? (
                        <Reanimated.View style={moreIconStyle}>
                            <Ionicons name="ellipsis-horizontal" size={34} color={theme.brand} />
                        </Reanimated.View>
                    ) : item.image ? (
                        <RemoteImage
                            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                            style={styles.categoryImage}
                            contentFit="cover"
                        />
                    ) : (
                        <Text style={[styles.categoryFallbackIcon, { color: theme.text }]}>{item.icon}</Text>
                    )}
                </View>
                <Text
                    style={[{ color: theme.text }, styles.categoryName]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    if (!propCategories && isLoading) {
        return (
            <View style={[styles.container, styles.skeletonGrid]}>
                {Array.from({ length: 8 }, (_, index) => (
                    <View key={`category-skeleton-${index}`} style={styles.categoryItem}>
                        <View style={[styles.categorySkeleton, { width: categoryImageSize, height: categoryImageSize, backgroundColor: theme.cardMuted }]} />
                        <View style={[styles.categoryNameSkeleton, { backgroundColor: theme.cardMuted }]} />
                    </View>
                ))}
            </View>
        );
    }

    if (!propCategories && error) {
        return <StateSurface kind="error" compact onRetry={() => void refetch()} />;
    }

    if (displayCategories.length === 0) {
        return null; // Or some fallback
    }

    return (
        <>
            <View style={[styles.container, { minHeight: Math.ceil((displayCategories.length || 1) / 4) * categoryRowHeight }]}>
                <FlashList
                    data={displayCategories}
                    renderItem={renderCategory}
                    keyExtractor={(item) => item.id}
                    numColumns={4}
                    scrollEnabled={false}
                />
            </View>
            {hasMoreCategories && (
                <Modal
                    visible={isDrawerVisible}
                    transparent
                    animationType="none"
                    onRequestClose={closeDrawer}
                >
                    <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={closeDrawer}>
                        <Animated.View
                            style={[styles.drawerContainer, { backgroundColor: theme.surfaceElevated, maxHeight: height * 0.75, transform: [{ translateY: drawerTranslateY }] }]}
                        >
                            <Pressable onPress={(e) => e.stopPropagation()}>
                            <View style={styles.drawerHandleContainer}>
                                <View style={[styles.drawerHandle, { backgroundColor: theme.borderStrong }]} />
                            </View>
                            <ScrollView
                                style={styles.drawerList}
                                contentContainerStyle={styles.drawerListContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {remainingCategories.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.drawerListItem,
                                            {
                                                borderBottomColor: theme.border,
                                                flexDirection: isArabic ? 'row-reverse' : 'row',
                                            },
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            closeDrawer();
                                            handleCategoryPress(category);
                                        }}
                                    >
                                        {category.image ? (
                                            <View style={[
                                                styles.drawerListImageFrame,
                                                { backgroundColor: theme.surface, borderColor: theme.border },
                                            ]}>
                                                <RemoteImage
                                                    source={typeof category.image === 'string' ? { uri: category.image } : category.image}
                                                    style={styles.drawerListImage}
                                                    contentFit="cover"
                                                />
                                            </View>
                                        ) : (
                                            <View style={[
                                                styles.drawerListImageFrame,
                                                { backgroundColor: theme.surface, borderColor: theme.border },
                                            ]}>
                                                <Text style={[styles.drawerListIcon, { color: theme.text }]}>{category.icon}</Text>
                                            </View>
                                        )}
                                        <Text
                                            style={[
                                                styles.drawerListText,
                                                {
                                                    color: theme.text,
                                                    textAlign: isArabic ? 'right' : 'left',
                                                    writingDirection: isArabic ? 'rtl' : 'ltr',
                                                },
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            </Pressable>
                        </Animated.View>
                    </Pressable>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: HOME_HORIZONTAL_GUTTER,
        paddingTop: 12,
        paddingBottom: 0,
    },
    categoryItem: {
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingBottom: 10,
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 22,
        marginBottom: 7,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
    },
    categoryFallbackIcon: {
        fontSize: 34,
        ...Typography.getTextVariantStyle('body'),
    },
    categoryName: {
        width: '100%',
        minHeight: 18,
        fontSize: 13,
        lineHeight: 16,
        ...Typography.getTextVariantStyle('body'),
        textAlign: 'center',
        textAlignVertical: 'top',
    },
    loaderContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skeletonGrid: {
        minHeight: 240,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    categorySkeleton: {
        borderRadius: 22,
        opacity: 0.8,
    },
    categoryNameSkeleton: {
        width: 48,
        height: 12,
        borderRadius: 6,
        marginTop: 8,
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 28,
    },
    drawerHandleContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    drawerHandle: {
        width: 40,
        height: 6,
        borderRadius: 3,
    },
    drawerTitle: {
        fontSize: 18,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textAlign: 'center',
        marginBottom: 12,
    },
    drawerList: {
        marginTop: 4,
    },
    drawerListContent: {
        paddingBottom: 24,
    },
    drawerListItem: {
        alignItems: 'center',
        gap: 14,
        minHeight: 76,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    drawerListImageFrame: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 16,
    },
    drawerListImage: {
        width: '100%',
        height: '100%',
    },
    drawerListIcon: {
        fontSize: 28,
    },
    drawerListText: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        fontSize: 16,
        lineHeight: 21,
        ...Typography.getTextVariantStyle('body'),
        color: '#000000',
    },
});
