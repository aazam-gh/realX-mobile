import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type SubCategory = {
    id: string;
    name: string;
    icon: string;
};

type Props = {
    subCategories?: SubCategory[];
    selectedId?: string;
    onSelect?: (subCategory: SubCategory) => void;
};

const defaultSubCategories: SubCategory[] = [
    { id: 'all', name: 'All', icon: '🍽️' },
    { id: 'burgers', name: 'Burgers', icon: '🍔' },
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'fried-chicken', name: 'Fried Chicken', icon: '🍗' },
    { id: 'turkish', name: 'Turkish', icon: '🥙' },
    { id: 'asian', name: 'Asian', icon: '🍜' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
];

export default function SubCategoryChips({
    subCategories = defaultSubCategories,
    selectedId = 'all',
    onSelect,
}: Props) {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {subCategories.map((subCategory) => {
                    const isSelected = selectedId === subCategory.id;
                    return (
                        <TouchableOpacity
                            key={subCategory.id}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected,
                            ]}
                            onPress={() => onSelect?.(subCategory)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconContainer,
                                isSelected && styles.iconContainerSelected,
                            ]}>
                                <Text style={styles.icon}>{subCategory.icon}</Text>
                            </View>
                            <Text style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected,
                            ]}>
                                {subCategory.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    chip: {
        alignItems: 'center',
        gap: 8,
    },
    chipSelected: {
        // Add any selected state styling if needed
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    iconContainerSelected: {
        borderColor: Colors.brandGreen,
        backgroundColor: '#E8FAF0',
    },
    icon: {
        fontSize: 28,
    },
    chipText: {
        fontSize: 12,
        fontFamily: Typography.metropolis.medium,
        color: Colors.light.text,
        textAlign: 'center',
    },
    chipTextSelected: {
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.brandGreen,
    },
});
