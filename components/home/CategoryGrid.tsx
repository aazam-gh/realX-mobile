import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type CategoryItem = {
    id: string;
    name: string;
    icon: string;
    backgroundColor: string;
};

type Props = {
    categories?: CategoryItem[];
    onCategoryPress?: (category: CategoryItem) => void;
};

const defaultCategories: CategoryItem[] = [
    { id: 'coffee', name: 'Coffee', icon: '☕', backgroundColor: '#E8F5E9' },
    { id: 'food', name: 'Food', icon: '🍕', backgroundColor: '#E3F2FD' },
    { id: 'grocery', name: 'Grocery', icon: '🛒', backgroundColor: '#FFF3E0' },
    { id: 'pharma', name: 'Pharma', icon: '💊', backgroundColor: '#E8F5E9' },
    { id: 'entertainer', name: 'Entertainer', icon: '🎮', backgroundColor: '#FCE4EC' },
    { id: 'books', name: 'Books', icon: '📚', backgroundColor: '#E3F2FD' },
    { id: 'electronics', name: 'Electronics', icon: '🎧', backgroundColor: '#EDE7F6' },
    { id: 'see-more', name: 'See More', icon: '›', backgroundColor: '#E8F5E9' },
];

export default function CategoryGrid({ categories = defaultCategories, onCategoryPress }: Props) {
    const router = useRouter();

    const handleCategoryPress = (item: CategoryItem) => {
        if (onCategoryPress) {
            onCategoryPress(item);
        } else if (item.id !== 'see-more') {
            router.push(`/category/${item.id}`);
        }
    };

    const renderCategory = ({ item }: { item: CategoryItem }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
                {item.id === 'see-more' ? (
                    <View style={styles.seeMoreContainer}>
                        <Text style={styles.seeMoreIcon}>{item.icon}</Text>
                    </View>
                ) : (
                    <Text style={styles.categoryIcon}>{item.icon}</Text>
                )}
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                numColumns={4}
                scrollEnabled={false}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.gridContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    gridContent: {
        gap: 16,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    categoryItem: {
        alignItems: 'center',
        width: '23%',
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryIcon: {
        fontSize: 32,
    },
    categoryName: {
        fontSize: 12,
        fontFamily: Typography.metropolis.medium,
        color: Colors.light.text,
        textAlign: 'center',
    },
    seeMoreContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: Colors.brandGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seeMoreIcon: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
