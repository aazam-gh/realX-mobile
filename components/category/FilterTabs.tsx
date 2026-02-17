import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Assuming these exist in your project, otherwise replace with hex strings
const BRAND_GREEN = '#58B368'; 
const BG_LIGHT = '#F5F5F5';

type FilterOption = {
    id: string;
    label: string;
    icon: any;
};

interface FilterTabsProps {
    selectedFilter: string;
    onFilterChange: (filterId: string) => void;
    filters?: FilterOption[];
}

const defaultFilters: FilterOption[] = [
    { id: 'top-rated', label: 'Top Rated', icon: 'flash' },
    { id: 'nearest', label: 'Nearest Offers', icon: 'location' },
];

export default function FilterTabs({ selectedFilter, onFilterChange, filters = defaultFilters }: FilterTabsProps ) {
    const translateX = useRef(new Animated.Value(0)).current;
    const containerWidth = Dimensions.get('window').width - 40; // Adjust based on your padding
    const tabWidth = containerWidth / filters.length;

    useEffect(() => {
        const index = filters.findIndex(f => f.id === selectedFilter);
        Animated.spring(translateX, {
            toValue: index * tabWidth,
            useNativeDriver: true,
            bounciness: 4,
        }).start();
    }, [selectedFilter]);

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                {/* Sliding Background */}
                <Animated.View 
                    style={[
                        styles.slider, 
                        { width: tabWidth, transform: [{ translateX }] }
                    ]} 
                />

                {/* Content Overlay */}
                {filters.map((filter) => {
                    const isSelected = selectedFilter === filter.id;
                    return (
                        <TouchableOpacity
                            key={filter.id}
                            style={[styles.filterButton, { width: tabWidth }]}
                            onPress={() => onFilterChange?.(filter.id)}
                            activeOpacity={1}
                        >
                            <Ionicons
                                name={filter.icon}
                                size={20}
                                color={isSelected ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.filterText, { color: isSelected ? '#FFFFFF' : '#000000' }]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    container: {
        flexDirection: 'row',
        backgroundColor: BG_LIGHT,
        borderRadius: 24, // Pure pill shape
        position: 'relative',
        height: 48,
        alignItems: 'center',
    },
    slider: {
        position: 'absolute',
        height: '100%',
        backgroundColor: BRAND_GREEN,
        borderRadius: 24,
        // Optional: add a slight border if you want it to look exactly like the image
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8,
        zIndex: 1, // Ensures text is above the slider
    },
    filterText: {
        fontSize: 16,
        fontWeight: '600',
    },
});