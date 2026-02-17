import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageSourcePropType, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BrowseSection,
    CategoryHeader,
    FilterTabs,
    SubCategoryChips,
} from '../../components/category';
import { SearchBar } from '../../components/home';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';



// Category configuration map
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


// Default config for unknown categories
const defaultConfig = {
    title: 'Category',
    icon: '📦',
    subCategories: [],
    promos: [],
    browseTitle: 'Browse items',
    browseEmoji: '🔍',
    restaurants: [],
};

export default function CategoryScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const router = useRouter();

    const [categoryData, setCategoryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('top-rated');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');

    // Get category configuration or use default
    const config = categoryConfig[id?.toLowerCase() || ''] || {
        ...defaultConfig,
        title: name || defaultConfig.title,
    };

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
                console.error("Error fetching category:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [id]);

    const hasSubCategories = (categoryData?.subcategories && categoryData.subcategories.length > 0) || (config.subCategories && config.subCategories.length > 0);

    const handleBackPress = () => {
        router.back();
    };

    const handleFilterChange = (filterId: string) => {
        setSelectedFilter(filterId);
    };

    const handleSubCategorySelect = (subCategory: { id: string; name: string; icon: string }) => {
        setSelectedSubCategory(subCategory.id);
    };

    const handleRestaurantPress = (restaurant: { id: string; name: string }) => {
        console.log('Restaurant pressed:', restaurant.name);
    };

    const handlePromoPress = (promo: { id: string; title: string }) => {
        console.log('Promo pressed:', promo.title);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                <CategoryHeader
                    title={categoryData?.nameEnglish || config.title}
                    icon={categoryData?.imageUrl || config.icon}
                    onBackPress={handleBackPress}
                />

                <SearchBar placeholder={`Search for ${(categoryData?.nameEnglish || config.title).toLowerCase()}...`} />

                {loading ? (
                    <View style={styles.comingSoonContainer}>
                        <Text>Loading...</Text>
                    </View>
                ) : hasSubCategories ? (
                    <>
                        <FilterTabs
                            selectedFilter={selectedFilter}
                            onFilterChange={handleFilterChange}
                        />

                        <SubCategoryChips
                            subCategories={categoryData?.subcategories?.map((sub: any) => ({
                                id: sub.nameEnglish, // Using name as ID for now or generate one if needed
                                name: sub.nameEnglish,
                                icon: sub.imageUrl
                            })) || config.subCategories}
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
                        <Text style={styles.comingSoonTitle}>{categoryData?.nameEnglish || config.title} Coming Soon!</Text>
                        <Text style={styles.comingSoonSubtitle}>
                            We're working hard to bring you the best {(categoryData?.nameEnglish || config.title).toLowerCase()} deals. Stay tuned!
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        // Shadow for premium look
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
});
