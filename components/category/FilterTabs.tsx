import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type FilterOption = {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
    selectedFilter: string;
    onFilterChange?: (filterId: string) => void;
    filters?: FilterOption[];
};

const defaultFilters: FilterOption[] = [
    { id: 'top-rated', label: 'Top Rated', icon: 'flash' },
    { id: 'nearest-offers', label: 'Nearest Offers', icon: 'location-outline' },
];

export default function FilterTabs({
    selectedFilter,
    onFilterChange,
    filters = defaultFilters,
}: Props) {
    return (
        <View style={styles.container}>
            {filters.map((filter) => {
                const isSelected = selectedFilter === filter.id;
                return (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterButton,
                            isSelected ? styles.filterButtonActive : styles.filterButtonInactive,
                        ]}
                        onPress={() => onFilterChange?.(filter.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={filter.icon}
                            size={16}
                            color={isSelected ? '#FFFFFF' : Colors.light.text}
                        />
                        <Text
                            style={[
                                styles.filterText,
                                isSelected ? styles.filterTextActive : styles.filterTextInactive,
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    filterButtonActive: {
        backgroundColor: Colors.brandGreen,
    },
    filterButtonInactive: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterText: {
        fontSize: 14,
        fontFamily: Typography.metropolis.semiBold,
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    filterTextInactive: {
        color: Colors.light.text,
    },
});
