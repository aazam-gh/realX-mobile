import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, startAfter, where } from '@react-native-firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, I18nManager, ImageSourcePropType, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BrowseSection,
    CategoryHeader,
    FilterTabs,
    RestaurantCard,
    SubCategoryChips
} from '../../components/category';
import { SearchBar } from '../../components/home';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const categoryConfig: Record<string, {
    title: string;
    icon: string | ImageSourcePropType;
    subCategories: { id: string; name: string; icon: string }[];
    promos: {
        id: string;
        title: string;
        subtitle: string;
        discount?: string;
        backgroundColor: string;
        accentColor?: string;
    }[];
    browseTitle: string;
    browseEmoji: string;
    restaurants: {
        id: string;
        name: string;
        cashbackText?: string;
        discountText?: string;
        isTrending?: boolean;
    }[];
}> = {};

const defaultConfig = {
    title: 'Category',
    icon: '📦',
    subCategories: [],
    promos: [],
    browseTitle: 'Browse items',
    browseEmoji: '🔎',
    restaurants: [],
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
        return arabicName || mapped?.ar || englishName || 'الفئة';
    }

    return englishName || mapped?.en || arabicName || 'Category';
}

function getLocalizedValue(
    language: string,
    englishValue?: string,
    arabicValue?: string,
    fallback?: string
) {
    if (language === 'ar') {
        return arabicValue || englishValue || fallback || '';
    }
    return englishValue || arabicValue || fallback || '';
}

interface HeaderContentProps {
    headerTitle: string;
    headerIcon: any;
    handleBackPress: () => void;
    loading: boolean;
    hasSubCategories: boolean;
    selectedFilter: string;
    handleFilterChange: (id: string) => void;
    subCategories: any[];
    selectedSubCategory: string;
    handleSubCategorySelect: (sub: any) => void;
    config: any;
    handleRestaurantPress: (r: any) => void;
    language: string;
    isRTL: boolean;
}

const HeaderContent = memo(({
    headerTitle,
    headerIcon,
    handleBackPress,
    loading,
    hasSubCategories,
    selectedFilter,
    handleFilterChange,
    subCategories,
    selectedSubCategory,
    handleSubCategorySelect,
    config,
    handleRestaurantPress,
    language,
    isRTL,
}: HeaderContentProps) => (
    <>
        <CategoryHeader
            title={headerTitle}
            icon={headerIcon}
            onBackPress={handleBackPress}
        />

        <SearchBar placeholder={language === 'ar' ? `ابحث عن ${headerTitle}...` : `Search for ${headerTitle.toLowerCase()}...`} />

        {loading ? (
            <View style={styles.comingSoonContainer}>
                <Text style={{ writingDirection: isRTL ? 'rtl' : 'ltr' }}>Loading...</Text>
            </View>
        ) : hasSubCategories ? (
            <>
                <FilterTabs
                    selectedFilter={selectedFilter}
                    onFilterChange={handleFilterChange}
                />

                <SubCategoryChips
                    subCategories={subCategories}
                    selectedId={selectedSubCategory}
                    onSelect={handleSubCategorySelect}
                />
                <BrowseSection
                    title={config.browseTitle}
                    emoji={config.browseEmoji}
                    restaurants={config.restaurants}
                    onRestaurantPress={handleRestaurantPress}
                />
            </>
        ) : (
            <View style={styles.comingSoonContainer}>
                <View style={styles.comingSoonIconContainer}>
                    <Text style={styles.comingSoonEmoji}>⏳</Text>
                </View>
                <Text
                    style={[
                        styles.comingSoonTitle,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' }
                    ]}
                >
                    {language === 'ar' ? `${headerTitle} قريبًا!` : `${headerTitle} Coming Soon!`}
                </Text>
                <Text
                    style={[
                        styles.comingSoonSubtitle,
                        { writingDirection: isRTL ? 'rtl' : 'ltr' }
                    ]}
                >
                    {language === 'ar'
                        ? `نعمل بجد لنقدم لك أفضل عروض ${headerTitle}. ترقب ذلك!`
                        : `We're working hard to bring you the best ${headerTitle.toLowerCase()} deals. Stay tuned!`}
                </Text>
            </View>
        )}
    </>
));

export default function CategoryScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const router = useRouter();
    const { i18n } = useTranslation();

    const language = i18n.language;
    const isRTL = language === 'ar' || I18nManager.isRTL;

    const [categoryData, setCategoryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');

    const [offers, setOffers] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [isListEnd, setIsListEnd] = useState(false);

    const config = categoryConfig[id?.toLowerCase() || ''] || {
        ...defaultConfig,
        title: name || defaultConfig.title,
    };

    const hasSubCategories =
        (categoryData?.subcategories && categoryData.subcategories.length > 0) ||
        (config.subCategories && config.subCategories.length > 0);

    useEffect(() => {
        const fetchCategory = async () => {
            if (!id) return;
            try {
                const db = getFirestore();
                const docRef = doc(db, 'categories', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCategoryData(docSnap.data());
                }
            } catch (error) {
                console.error('Error fetching category:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchCategory();
    }, [id]);

    const fetchOffers = async (isNew = false) => {
        if (loadingOffers || (isListEnd && !isNew) || !hasSubCategories) return;

        setLoadingOffers(true);
        try {
            const db = getFirestore();
            const offersRef = collection(db, 'offers');
            const categoryName = categoryData?.nameEnglish || config.title;
            const PAGE_SIZE = 10;

            let q;
            const baseConstraints: any[] = [where('status', '==', 'active')];

            if (selectedSubCategory !== 'all') {
                baseConstraints.push(where('categories', 'array-contains', selectedSubCategory));
            } else {
                baseConstraints.push(where('mainCategory', '==', categoryName));
            }

            if (selectedFilter === 'trending') {
                baseConstraints.push(where('isTrending', '==', true));
            } else if (selectedFilter === 'top-rated') {
                baseConstraints.push(where('isTopRated', '==', true));
            }

            if (isNew) {
                q = query(offersRef, ...baseConstraints, orderBy('createdAt', 'desc') as any, limit(PAGE_SIZE) as any);
            } else {
                q = query(offersRef, ...baseConstraints, orderBy('createdAt', 'desc') as any, startAfter(lastDoc) as any, limit(PAGE_SIZE) as any);
            }

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const fetchedOffers = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

                if (isNew) {
                    setOffers(fetchedOffers);
                } else {
                    setOffers(prev => [...prev, ...fetchedOffers]);
                }

                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);

                if (querySnapshot.docs.length < PAGE_SIZE) {
                    setIsListEnd(true);
                } else {
                    setIsListEnd(false);
                }
            } else {
                setIsListEnd(true);
                if (isNew) setOffers([]);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoadingOffers(false);
        }
    };

    useEffect(() => {
        if (!loading && hasSubCategories) {
            setLastDoc(null);
            setIsListEnd(false);
            void fetchOffers(true);
        }
    }, [selectedSubCategory, selectedFilter, loading, hasSubCategories, config.title]);

    const handleLoadMore = () => {
        if (!loadingOffers && !isListEnd) {
            void fetchOffers(false);
        }
    };

    const handleBackPress = useCallback(() => {
        router.back();
    }, [router]);

    const handleFilterChange = useCallback((filterId: string) => {
        setSelectedFilter(prev => prev === filterId ? '' : filterId);
    }, []);

    const handleSubCategorySelect = useCallback((subCategory: { id: string; name: string; icon: any }) => {
        setSelectedSubCategory(subCategory.id);
    }, []);

    const handleRestaurantPress = useCallback((restaurant: { id: string; name: string }) => {
        console.log('Restaurant pressed:', restaurant.name);
    }, []);

    const handlePromoPress = useCallback((promo: { id: string; title: string; vendorId?: string }) => {
        if (promo.vendorId) {
            router.push({ pathname: '/vendor/[id]', params: { id: promo.vendorId } });
        } else {
            console.log('Promo pressed but no vendorId:', promo.title);
        }
    }, [router]);

    const subCategories = useMemo(() => {
        const fetchedSubCategories = categoryData?.subcategories?.map((sub: any) => ({
            id: sub.nameEnglish,
            name: getLocalizedValue(language, sub.nameEnglish, sub.nameArabic, sub.nameEnglish),
            icon: sub.imageUrl
        })) || config.subCategories;

        return [
            { id: 'all', name: language === 'ar' ? 'الكل' : 'All', icon: require('../../assets/images/all.png') },
            ...fetchedSubCategories
        ];
    }, [categoryData, config.subCategories, language]);

    const headerTitle = getMappedCategory(
        language,
        categoryData?.nameEnglish || config.title,
        categoryData?.nameArabic,
        typeof id === 'string' ? id : undefined
    );

    const headerIcon = categoryData?.imageUrl || config.icon;

    const renderFooter = () => {
        if (!loadingOffers) return <View style={{ height: 20 }} />;
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
            {!loading && hasSubCategories ? (
                <FlashList
                    data={offers}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <HeaderContent
                            headerTitle={headerTitle}
                            headerIcon={headerIcon}
                            handleBackPress={handleBackPress}
                            loading={loading}
                            hasSubCategories={hasSubCategories}
                            selectedFilter={selectedFilter}
                            handleFilterChange={handleFilterChange}
                            subCategories={subCategories}
                            selectedSubCategory={selectedSubCategory}
                            handleSubCategorySelect={handleSubCategorySelect}
                            config={config}
                            handleRestaurantPress={handleRestaurantPress}
                            language={language}
                            isRTL={isRTL}
                        />
                    }
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    renderItem={({ item, index }) => (
                        <View
                            style={[
                                styles.offerCardWrapper,
                                {
                                    paddingLeft: index % 2 === 0 ? 20 : 8,
                                    paddingRight: index % 2 === 0 ? 8 : 20
                                }
                            ]}
                        >
                            <RestaurantCard
                                id={item.id}
                                name={getLocalizedValue(language, item.titleEn, item.titleAr, 'Untitled Offer')}
                                cashbackText={getLocalizedValue(language, item.descriptionEn, item.descriptionAr, 'Special Offer')}
                                discountText={`${item.discountValue}${item.discountType === 'percentage' ? '%' : ''} OFF`}
                                isTrending={item.isTrending}
                                isTopRated={item.isTopRated}
                                imageUri={item.bannerImage}
                                onPress={() => handlePromoPress({ id: item.id, title: item.titleEn, vendorId: item.vendorId })}
                            />
                        </View>
                    )}
                />
            ) : (
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                >
                    <HeaderContent
                        headerTitle={headerTitle}
                        headerIcon={headerIcon}
                        handleBackPress={handleBackPress}
                        loading={loading}
                        hasSubCategories={hasSubCategories}
                        selectedFilter={selectedFilter}
                        handleFilterChange={handleFilterChange}
                        subCategories={subCategories}
                        selectedSubCategory={selectedSubCategory}
                        handleSubCategorySelect={handleSubCategorySelect}
                        config={config}
                        handleRestaurantPress={handleRestaurantPress}
                        language={language}
                        isRTL={isRTL}
                    />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    flatListContent: {
        paddingBottom: 20,
    },
    comingSoonContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 80,
    },
    comingSoonIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    comingSoonEmoji: {
        fontSize: 60,
    },
    comingSoonTitle: {
        fontSize: 24,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    comingSoonSubtitle: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 24,
    },
    offersContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    offersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
    },
    offerCardWrapper: {
        marginBottom: 16,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
});
