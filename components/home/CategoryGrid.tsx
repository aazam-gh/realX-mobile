import { collection, getDocs, getFirestore, orderBy, query } from '@react-native-firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ThemedText } from '../ThemedText';

type CategoryItem = {
    id: string;
    name: string;
    image?: string | any;
    icon?: string;
};

type Props = {
    categories?: CategoryItem[];
    onCategoryPress?: (category: CategoryItem) => void;
};

const CATEGORY_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
    books: { en: 'Books', ar: 'كتب' },
    coffee: { en: 'Coffee', ar: 'قهوة' },
    electronics: { en: 'Electronics', ar: 'إلكترونيات' },
    entertainment: { en: 'Entertainment', ar: 'ترفيه' },
    food: { en: 'Food', ar: 'طعام' },
    pharmacy: { en: 'Pharmacy', ar: 'صيدلية' },
    grocery: { en: 'Grocery', ar: 'بقالة' },
};

function normalizeCategoryKey(value?: string) {
    return (value || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '');
}

function getMappedCategory(language: string, englishName?: string, arabicName?: string, id?: string) {
    const keyFromEnglish = normalizeCategoryKey(englishName);
    const keyFromId = normalizeCategoryKey(id);
    const mapped = CATEGORY_TRANSLATIONS[keyFromEnglish] || CATEGORY_TRANSLATIONS[keyFromId];

    if (language === 'ar') {
        return arabicName || mapped?.ar || englishName || 'فئة';
    }

    return englishName || mapped?.en || arabicName || 'Category';
}

export default function CategoryGrid({ categories: propCategories, onCategoryPress }: Props) {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar' || I18nManager.isRTL;

    const [fetchedCategories, setFetchedCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(!propCategories);

    useEffect(() => {
        if (propCategories) return;

        const fetchCategories = async () => {
            try {
                const db = getFirestore();
                const q = query(
                    collection(db, 'categories'),
                    orderBy('order', 'asc')
                );

                const snapshot = await getDocs(q);

                const items: CategoryItem[] = snapshot.docs.map((doc: { id: string; data: () => any }) => {
                    const data = doc.data();

                    const englishName =
                        data.nameEnglish ??
                        data.name_en ??
                        data.name ??
                        '';

                    const arabicName =
                        data.nameArabic ??
                        data.name_ar ??
                        '';

                    return {
                        id: doc.id,
                        name: getMappedCategory(i18n.language, englishName, arabicName, doc.id),
                        image: data.imageUrl,
                    };
                });

                if (items.length > 0) {
                    items.push({
                        id: 'coming-soon',
                        name: t('coming_soon'),
                        image: require('../../assets/images/see-more.png')
                    });
                }

                setFetchedCategories(items);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchCategories();
    }, [propCategories, i18n.language, t]);

    const displayCategories = propCategories || fetchedCategories;

    const handleCategoryPress = (item: CategoryItem) => {
        if (onCategoryPress) {
            onCategoryPress(item);
        } else if (item.id !== 'coming-soon') {
            router.push({
                pathname: "/category/[id]",
                params: { id: item.id, name: item.name }
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
                            style={styles.categoryImage}
                            contentFit="contain"
                        />
                    ) : (
                        <ThemedText style={{ fontSize: 40 }}>{item.icon}</ThemedText>
                    )}
                </View>

                <ThemedText
                    style={[
                        styles.categoryName,
                        {
                            writingDirection: isRTL ? 'rtl' : 'ltr',
                            textAlign: 'center',
                        }
                    ]}
                    numberOfLines={1}
                >
                    {item.name}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loaderContainer]}>
                <ActivityIndicator size="small" color={Colors.light.tint} />
            </View>
        );
    }

    if (displayCategories.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { minHeight: Math.ceil((displayCategories.length || 1) / 4) * 130 }]}>
            <FlashList
                data={displayCategories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                numColumns={4}
                scrollEnabled={false}
                extraData={i18n.language}
            />
        </View>
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
        fontFamily: Typography.metropolis.medium,
        textAlign: 'center',
    },
    loaderContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
