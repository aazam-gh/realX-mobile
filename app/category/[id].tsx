import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    BrowseSection,
    CategoryHeader,
    FilterTabs,
    PromoCarousel,
    SubCategoryChips,
} from '../../components/category';
import { SearchBar } from '../../components/home';
import { Colors } from '../../constants/Colors';

// Category configuration map
const categoryConfig: Record<string, {
    title: string;
    icon: string;
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
}> = {
    food: {
        title: 'Food',
        icon: '🍽️',
        subCategories: [
            { id: 'all', name: 'All', icon: '🍽️' },
            { id: 'burgers', name: 'Burgers', icon: '🍔' },
            { id: 'pizza', name: 'Pizza', icon: '🍕' },
            { id: 'fried-chicken', name: 'Fried Chicken', icon: '🍗' },
            { id: 'turkish', name: 'Turkish', icon: '🥙' },
            { id: 'asian', name: 'Asian', icon: '🍜' },
            { id: 'desserts', name: 'Desserts', icon: '🍰' },
        ],
        promos: [
            {
                id: '1',
                title: 'TRENDING',
                subtitle: 'OFFERS',
                discount: 'Upto 50% OFF',
                backgroundColor: '#18B852',
                accentColor: '#FFFFFF',
            },
            {
                id: '2',
                title: 'STUDENT',
                subtitle: 'FEAST',
                discount: 'More than 50+ Restaurants',
                backgroundColor: '#E53935',
                accentColor: '#FFFFFF',
            },
            {
                id: '3',
                title: 'CASH',
                subtitle: 'BACK',
                discount: '30% Cashback',
                backgroundColor: '#F9A825',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Yallah! browse food',
        browseEmoji: '😋',
        restaurants: [
            { id: '1', name: 'TeaTime', cashbackText: 'Cashbacks', discountText: '60% DISCOUNT', isTrending: false },
            { id: '2', name: 'Sahtein', cashbackText: 'Cashbacks', discountText: '60% DISCOUNT', isTrending: true },
            { id: '3', name: 'Salt Bae', cashbackText: 'Cashbacks', discountText: '40% DISCOUNT', isTrending: false },
            { id: '4', name: 'Burger King', cashbackText: 'Cashbacks', discountText: '50% DISCOUNT', isTrending: true },
        ],
    },
    coffee: {
        title: 'Coffee',
        icon: '☕',
        subCategories: [
            { id: 'all', name: 'All', icon: '☕' },
            { id: 'latte', name: 'Latte', icon: '🥛' },
            { id: 'espresso', name: 'Espresso', icon: '☕' },
            { id: 'cold-brew', name: 'Cold Brew', icon: '🧊' },
            { id: 'tea', name: 'Tea', icon: '🍵' },
            { id: 'smoothie', name: 'Smoothies', icon: '🍹' },
        ],
        promos: [
            {
                id: '1',
                title: 'MORNING',
                subtitle: 'DEAL',
                discount: '40% OFF before 10am',
                backgroundColor: '#6D4C41',
                accentColor: '#FFFFFF',
            },
            {
                id: '2',
                title: 'HAPPY',
                subtitle: 'HOUR',
                discount: 'Buy 1 Get 1 Free',
                backgroundColor: '#FF7043',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Grab your coffee',
        browseEmoji: '☕',
        restaurants: [
            { id: '1', name: 'Starbucks', cashbackText: 'Cashbacks', discountText: '30% DISCOUNT', isTrending: true },
            { id: '2', name: 'Costa Coffee', cashbackText: 'Cashbacks', discountText: '25% DISCOUNT', isTrending: false },
            { id: '3', name: 'Tim Hortons', cashbackText: 'Cashbacks', discountText: '40% DISCOUNT', isTrending: true },
        ],
    },
    grocery: {
        title: 'Grocery',
        icon: '🛒',
        subCategories: [
            { id: 'all', name: 'All', icon: '🛒' },
            { id: 'fruits', name: 'Fruits', icon: '🍎' },
            { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
            { id: 'dairy', name: 'Dairy', icon: '🥛' },
            { id: 'bakery', name: 'Bakery', icon: '🍞' },
            { id: 'meat', name: 'Meat', icon: '🥩' },
        ],
        promos: [
            {
                id: '1',
                title: 'FRESH',
                subtitle: 'DEALS',
                discount: 'Up to 35% OFF',
                backgroundColor: '#4CAF50',
                accentColor: '#FFFFFF',
            },
            {
                id: '2',
                title: 'WEEKLY',
                subtitle: 'SPECIALS',
                discount: 'Save Big!',
                backgroundColor: '#2196F3',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Shop groceries',
        browseEmoji: '🛒',
        restaurants: [
            { id: '1', name: 'Carrefour', cashbackText: 'Cashbacks', discountText: '20% DISCOUNT', isTrending: true },
            { id: '2', name: 'Lulu', cashbackText: 'Cashbacks', discountText: '15% DISCOUNT', isTrending: false },
            { id: '3', name: 'Spinneys', cashbackText: 'Cashbacks', discountText: '25% DISCOUNT', isTrending: false },
        ],
    },
    pharma: {
        title: 'Pharma',
        icon: '💊',
        subCategories: [
            { id: 'all', name: 'All', icon: '💊' },
            { id: 'medicines', name: 'Medicines', icon: '💉' },
            { id: 'vitamins', name: 'Vitamins', icon: '🔋' },
            { id: 'skincare', name: 'Skincare', icon: '🧴' },
            { id: 'baby', name: 'Baby Care', icon: '👶' },
        ],
        promos: [
            {
                id: '1',
                title: 'HEALTH',
                subtitle: 'WEEK',
                discount: '30% OFF Vitamins',
                backgroundColor: '#00BCD4',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Browse pharmacies',
        browseEmoji: '💊',
        restaurants: [
            { id: '1', name: 'Boots', cashbackText: 'Cashbacks', discountText: '20% DISCOUNT', isTrending: true },
            { id: '2', name: 'Life Pharmacy', cashbackText: 'Cashbacks', discountText: '15% DISCOUNT', isTrending: false },
        ],
    },
    entertainer: {
        title: 'Entertainer',
        icon: '🎮',
        subCategories: [
            { id: 'all', name: 'All', icon: '🎮' },
            { id: 'movies', name: 'Movies', icon: '🎬' },
            { id: 'sports', name: 'Sports', icon: '⚽' },
            { id: 'parks', name: 'Parks', icon: '🎢' },
            { id: 'spa', name: 'Spa', icon: '💆' },
        ],
        promos: [
            {
                id: '1',
                title: 'FUN',
                subtitle: 'DEALS',
                discount: '2 for 1 Offers',
                backgroundColor: '#9C27B0',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Find entertainment',
        browseEmoji: '🎉',
        restaurants: [
            { id: '1', name: 'VOX Cinemas', cashbackText: 'Cashbacks', discountText: '50% DISCOUNT', isTrending: true },
            { id: '2', name: 'Magic Planet', cashbackText: 'Cashbacks', discountText: '40% DISCOUNT', isTrending: true },
        ],
    },
    books: {
        title: 'Books',
        icon: '📚',
        subCategories: [
            { id: 'all', name: 'All', icon: '📚' },
            { id: 'fiction', name: 'Fiction', icon: '📖' },
            { id: 'non-fiction', name: 'Non-Fiction', icon: '📘' },
            { id: 'academic', name: 'Academic', icon: '🎓' },
            { id: 'children', name: 'Children', icon: '🧒' },
        ],
        promos: [
            {
                id: '1',
                title: 'BOOK',
                subtitle: 'FAIR',
                discount: 'Up to 60% OFF',
                backgroundColor: '#3F51B5',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Browse bookstores',
        browseEmoji: '📚',
        restaurants: [
            { id: '1', name: 'Kinokuniya', cashbackText: 'Cashbacks', discountText: '25% DISCOUNT', isTrending: true },
            { id: '2', name: 'Virgin Megastore', cashbackText: 'Cashbacks', discountText: '20% DISCOUNT', isTrending: false },
        ],
    },
    electronics: {
        title: 'Electronics',
        icon: '🎧',
        subCategories: [
            { id: 'all', name: 'All', icon: '🎧' },
            { id: 'phones', name: 'Phones', icon: '📱' },
            { id: 'laptops', name: 'Laptops', icon: '💻' },
            { id: 'gaming', name: 'Gaming', icon: '🎮' },
            { id: 'audio', name: 'Audio', icon: '🔊' },
        ],
        promos: [
            {
                id: '1',
                title: 'TECH',
                subtitle: 'DEALS',
                discount: 'Up to 40% OFF',
                backgroundColor: '#607D8B',
                accentColor: '#FFFFFF',
            },
        ],
        browseTitle: 'Shop electronics',
        browseEmoji: '⚡',
        restaurants: [
            { id: '1', name: 'Sharaf DG', cashbackText: 'Cashbacks', discountText: '30% DISCOUNT', isTrending: true },
            { id: '2', name: 'Emax', cashbackText: 'Cashbacks', discountText: '25% DISCOUNT', isTrending: false },
        ],
    },
};

// Default config for unknown categories
const defaultConfig = {
    title: 'Category',
    icon: '📦',
    subCategories: [{ id: 'all', name: 'All', icon: '📦' }],
    promos: [],
    browseTitle: 'Browse items',
    browseEmoji: '🔍',
    restaurants: [],
};

export default function CategoryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [selectedFilter, setSelectedFilter] = useState('top-rated');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');

    // Get category configuration or use default
    const config = categoryConfig[id?.toLowerCase() || ''] || defaultConfig;

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
        // Navigate to restaurant detail (placeholder)
        console.log('Restaurant pressed:', restaurant.name);
    };

    const handlePromoPress = (promo: { id: string; title: string }) => {
        // Navigate to promo detail (placeholder)
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
                    title={config.title}
                    icon={config.icon}
                    onBackPress={handleBackPress}
                />

                <SearchBar placeholder="Search for anything..." />

                <FilterTabs
                    selectedFilter={selectedFilter}
                    onFilterChange={handleFilterChange}
                />

                <PromoCarousel
                    promos={config.promos}
                    onPromoPress={handlePromoPress}
                />

                <SubCategoryChips
                    subCategories={config.subCategories}
                    selectedId={selectedSubCategory}
                    onSelect={handleSubCategorySelect}
                />

                <BrowseSection
                    title={config.browseTitle}
                    emoji={config.browseEmoji}
                    restaurants={config.restaurants}
                    onRestaurantPress={handleRestaurantPress}
                />
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
});
