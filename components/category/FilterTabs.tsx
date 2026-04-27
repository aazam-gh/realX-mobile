import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';

const BRAND_GREEN = '#18B852';
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

    const currentFilters = useMemo(() => filters || [
        { id: 'all', label: t('filter_all'), icon: 'apps-outline' },
        { id: 'cashbacks', label: t('filter_cash'), icon: 'cash-outline' },
        { id: 'trending', label: t('filter_top'), icon: 'flame' },
    ], [filters, t]);

    const containerWidth = Dimensions.get('window').width - 40;
    const tabWidth = containerWidth / currentFilters.length;

    const initialIndex = currentFilters.findIndex(f => f.id === selectedFilter);
    const translateX = useSharedValue(initialIndex !== -1 ? initialIndex * tabWidth : 0);
    const opacity = useSharedValue(selectedFilter ? 1 : 0);

    useEffect(() => {
        const index = currentFilters.findIndex(f => f.id === selectedFilter);
        const hasSelection = index !== -1;

        if (hasSelection) {
            translateX.value = withTiming(index * tabWidth, {
                duration: 250,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });
            opacity.value = withTiming(1, { duration: 150 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
        }
    }, [selectedFilter, currentFilters, tabWidth, translateX, opacity]);

    const sliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.outerContainer}>
            <View style={styles.container}>
                <Animated.View
                    style={[styles.slider, { width: tabWidth }, sliderStyle]}
                />

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
