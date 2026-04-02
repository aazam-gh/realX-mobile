import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';

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

export default function FilterTabs({ selectedFilter, onFilterChange, filters }: FilterTabsProps) {
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;

    const currentFilters = filters || [
        { id: 'all', label: t('filter_all'), icon: 'apps-outline' },
        { id: 'cashbacks', label: t('filter_cash'), icon: 'cash-outline' },
        { id: 'trending', label: t('filter_top'), icon: 'flame' },
    ];

    const containerWidth = Dimensions.get('window').width - 40; // Adjust based on your padding
    const tabWidth = containerWidth / currentFilters.length;

    // Initial position based on selectedFilter
    const initialIndex = currentFilters.findIndex(f => f.id === selectedFilter);
    // If we want to keep positions SAME (All on left), then for RTL we need to handle the mirroring.
    // In LTR: tab 0 is at 0.
    // In RTL: tab 0 is at 0 (which is right side), so we want it to be at 'tabWidth * (length - 1)'? 
    // Wait, the simplest way is to disable RTL mirroring for the container and children.
    
    const translateX = useRef(new Animated.Value(initialIndex !== -1 ? initialIndex * tabWidth : 0)).current;
    const opacity = useRef(new Animated.Value(selectedFilter ? 1 : 0)).current;

    useEffect(() => {
        const index = currentFilters.findIndex(f => f.id === selectedFilter);
        const hasSelection = index !== -1;

        if (hasSelection) {
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: index * tabWidth,
                    useNativeDriver: true,
                    bounciness: 4,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [selectedFilter, currentFilters, tabWidth, translateX, opacity]);

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                {/* Sliding Background */}
                <Animated.View
                    style={[
                        styles.slider,
                        { width: tabWidth, transform: [{ translateX }], opacity }
                    ]}
                />

                {/* Content Overlay */}
                {currentFilters.map((filter) => {
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
        // Force LTR layout to keep tab positions same in Arabic
        direction: 'ltr',
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
        fontSize: 14,
        fontFamily: Typography.poppins.semiBold,
        // Ensure Arabic text looks good
        marginTop: I18nManager.isRTL ? -2 : 0,
    },
});
