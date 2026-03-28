import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../../components/ThemedText';

const safeImage = require('../../assets/images/food.png');

const iconMap: Record<string, any> = {
  books: safeImage,
  coffee: safeImage,
  electronics: safeImage,
  entertainment: safeImage,
  food: safeImage,
  pharmacy: safeImage,
  grocery: safeImage,
};

const foodItems = [
  { id: 'all', labelKey: 'all', emoji: '??' },
  { id: 'burger', labelKey: 'burger', emoji: '?' },
  { id: 'pizza', labelKey: 'pizza', emoji: '??' },
];

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const { t, i18n } = useTranslation();

  const id = (params.id || '').toLowerCase();
  const title = params.title || t(id || 'category');
  const isFood = id === 'food';

  const getSearchPlaceholder = () => {
    if (id === 'books') return t('search_books');
    if (id === 'coffee') return t('search_coffee');
    if (id === 'electronics') return t('search_electronics');
    if (id === 'food') return t('search_food');
    return t('search_anything');
  };

  const getComingSoonTitle = () => {
    const map: Record<string, string> = {
      books: 'books_coming_soon',
      coffee: 'coffee_coming_soon',
      electronics: 'electronics_coming_soon',
      entertainment: 'entertainment_coming_soon',
      food: 'food_coming_soon',
      pharmacy: 'pharmacy_coming_soon',
      grocery: 'grocery_coming_soon',
    };
    return t(map[id] || 'coming_soon');
  };

  const getComingSoonDesc = () => {
    const map: Record<string, string> = {
      books: 'books_coming_soon_desc',
      coffee: 'coffee_coming_soon_desc',
      electronics: 'electronics_coming_soon_desc',
      entertainment: 'entertainment_coming_soon_desc',
      food: 'food_coming_soon_desc',
      pharmacy: 'pharmacy_coming_soon_desc',
      grocery: 'grocery_coming_soon_desc',
    };
    return t(map[id] || 'coming_soon');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons
              name={i18n.language === 'ar' ? 'arrow-forward' : 'arrow-back'}
              size={28}
              color="#000"
            />
          </TouchableOpacity>

          <Image source={iconMap[id]} style={styles.headerIcon} contentFit="cover" />
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={22} color="#20C05C" />
          <TextInput
            style={[
              styles.searchInput,
              {
                textAlign: i18n.language === 'ar' ? 'right' : 'left',
                writingDirection: i18n.language === 'ar' ? 'rtl' : 'ltr',
              },
            ]}
            placeholder={getSearchPlaceholder()}
            placeholderTextColor="#777"
          />
        </View>

        {isFood ? (
          <>
            <View style={styles.filterRow}>
              <View style={styles.filterPill}>
                <Ionicons name="flash" size={18} color="#000" />
                <ThemedText style={styles.filterText}>{t('top_rated')}</ThemedText>
              </View>
              <View style={styles.filterPill}>
                <Ionicons name="flame" size={18} color="#000" />
                <ThemedText style={styles.filterText}>{t('trending')}</ThemedText>
              </View>
            </View>

            <View style={styles.foodCategoryRow}>
              {foodItems.map((item) => (
                <View key={item.id} style={styles.foodCategoryItem}>
                  <View style={[styles.foodCircle, item.id === 'all' && styles.foodCircleActive]}>
                    <ThemedText style={styles.foodEmoji}>{item.emoji}</ThemedText>
                  </View>
                  <ThemedText style={[styles.foodLabel, item.id === 'all' && styles.foodLabelActive]}>
                    {t(item.labelKey)}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.browseHeader}>
              <ThemedText style={styles.browseTitle}>{t('browse_items')}</ThemedText>
              <ThemedText style={styles.browseIcon}>??</ThemedText>
            </View>
          </>
        ) : (
          <View style={styles.comingSoonWrap}>
            <View style={styles.hourglassWrap}>
              <ThemedText style={styles.hourglass}>?</ThemedText>
            </View>
            <ThemedText style={styles.comingSoonTitle}>{getComingSoonTitle()}</ThemedText>
            <ThemedText style={styles.comingSoonDesc}>{getComingSoonDesc()}</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  backBtn: {
    marginEnd: 12,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginEnd: 10,
  },
  headerTitle: {
    fontSize: 22,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    marginStart: 10,
    fontSize: 16,
  },
  comingSoonWrap: {
    alignItems: 'center',
    marginTop: 80,
  },
  hourglassWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
  },
  hourglass: {
    fontSize: 64,
  },
  comingSoonTitle: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonDesc: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7A7A7A',
    lineHeight: 28,
    paddingHorizontal: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  filterPill: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 16,
  },
  foodCategoryRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  foodCategoryItem: {
    alignItems: 'center',
  },
  foodCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodCircleActive: {
    borderWidth: 3,
    borderColor: '#20C05C',
    backgroundColor: '#FFFFFF',
  },
  foodEmoji: {
    fontSize: 28,
  },
  foodLabel: {
    fontSize: 14,
    color: '#333',
  },
  foodLabelActive: {
    color: '#20C05C',
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseTitle: {
    fontSize: 20,
  },
  browseIcon: {
    fontSize: 22,
  },
});
