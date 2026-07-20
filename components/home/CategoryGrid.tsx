import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { logger } from '../../utils/logger';
import { fetchCategories } from '../../utils/firebaseQueries';
import { queryKeys } from '../../utils/queryClient';

type CategoryItem = {
    id: string;
    name: string;
    englishName?: string;
    image?: string | any;
    icon?: string;
};

type Props = {
    categories?: CategoryItem[];
    onCategoryPress?: (category: CategoryItem) => void;
};

const MAX_VISIBLE_CATEGORIES = 7;
const SEE_MORE_IMAGE = require('../../assets/images/see-more.svg');

export default function CategoryGrid({ categories: propCategories, onCategoryPress }: Props) {
    const router = useRouter();
    const { height, width } = useWindowDimensions();
    const { t } = useTranslation();
    const { locale } = useAppLocale();
    const { theme } = useAppTheme();
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);

    const isArabic = locale === 'ar';

    const {
        data: fetchedCategories = [],
        error,
        isLoading,
    } = useQuery<CategoryItem[]>({
        queryKey: queryKeys.categories(isArabic ? 'ar' : 'en'),
        queryFn: () => fetchCategories(isArabic),
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
        image: SEE_MORE_IMAGE,
    };
    const displayCategories = hasMoreCategories ? [...visibleCategories, comingSoonItem] : baseCategories;
    const categoryImageSize = Math.min(80, Math.max(64, (width - 64) / 4));

    const closeDrawer = () => setIsDrawerVisible(false);

    const handleCategoryPress = (item: CategoryItem) => {
        triggerSubtleHaptic();
        if (item.id === 'coming-soon') {
            if (hasMoreCategories) {
                setIsDrawerVisible(true);
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
                activeOpacity={0.7}
            >
                <View style={styles.imageContainer}>
                    {item.image ? (
                        <Image
                            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                            style={[styles.categoryImage, { width: categoryImageSize, height: categoryImageSize }]}
                            contentFit="contain"
                        />
                    ) : (
                        <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('body') }, { fontSize: 40 }]}>{item.icon}</Text>
                    )}
                </View>
                <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('body') }, styles.categoryName]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    if (!propCategories && isLoading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="small" color={theme.brand} />
            </View>
        );
    }

    if (displayCategories.length === 0) {
        return null; // Or some fallback
    }

    return (
        <>
            <View style={[styles.container, { minHeight: Math.ceil((displayCategories.length || 1) / 4) * 130 }]}>
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
                    animationType="slide"
                    onRequestClose={closeDrawer}
                >
                    <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={closeDrawer}>
                        <Pressable style={[styles.drawerContainer, { backgroundColor: theme.surfaceElevated, maxHeight: height * 0.75 }]} onPress={(e) => e.stopPropagation()}>
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
                                        style={[styles.drawerListItem, { borderBottomColor: theme.border }]}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            closeDrawer();
                                            handleCategoryPress(category);
                                        }}
                                    >
                                        {category.image ? (
                                            <Image
                                                source={typeof category.image === 'string' ? { uri: category.image } : category.image}
                                                style={styles.drawerListImage}
                                                contentFit="contain"
                                            />
                                        ) : (
                                            <Text style={[styles.drawerListIcon, { color: theme.text }]}>{category.icon}</Text>
                                        )}
                                        <Text style={[styles.drawerListText, { color: theme.text }]}>{category.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    categoryItem: {
        alignItems: 'center',
        marginBottom: 16,
    },
    imageContainer: {
        marginBottom: 8,
    },
    categoryImage: {
        width: 80,
        height: 80,
    },
    categoryName: {
        fontSize: 12,
        ...Typography.getTextVariantStyle('body'),
        textAlign: 'center',
    },
    loaderContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    drawerListImage: {
        width: 48,
        height: 48,
        marginRight: 12,
    },
    drawerListIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    drawerListText: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('body'),
        color: '#000000',
    },
});
