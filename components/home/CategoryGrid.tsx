import { collection, getFirestore, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../ThemedText';
import { Colors } from '../../constants/Colors';

type CategoryItem = {
  id: string;
  name?: string;
  name_en?: string;
  name_ar?: string;
  image?: string;
  order?: number;
};

const fallbackImageMap: Record<string, any> = {
  books: require('../../assets/images/books.png'),
  coffee: require('../../assets/images/coffee.png'),
  electronics: require('../../assets/images/electronics.png'),
  entertainment: require('../../assets/images/food.png'),
  food: require('../../assets/images/food.png'),
  pharmacy: require('../../assets/images/food.png'),
  grocery: require('../../assets/images/grocery.png'),
  'coming-soon': require('../../assets/images/see-more.png'),
};

const visibleOrder = [
  'books',
  'coffee',
  'electronics',
  'entertainment',
  'food',
  'pharmacy',
  'grocery',
  'coming-soon',
];

export default function CategoryGrid() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();

    const unsubscribe = onSnapshot(
      query(collection(db, 'categories'), orderBy('order', 'asc')),
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id.toLowerCase(),
          ...(doc.data() as any),
        })) as CategoryItem[];

        const ordered = visibleOrder.map((id) => {
          if (id === 'coming-soon') {
            return {
              id,
              name_en: t('coming_soon'),
              name_ar: t('coming_soon'),
            } as CategoryItem;
          }

          return fetched.find((item) => item.id === id) || { id };
        });

        setCategories(ordered);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [t]);

  const getLabel = (item: CategoryItem) => {
    if (item.id === 'coming-soon') return t('coming_soon');

    if (i18n.language === 'ar') {
      return item.name_ar || t(item.id);
    }

    return item.name_en || t(item.id);
  };

  const getImageSource = (item: CategoryItem) => {
    if (typeof item.image === 'string' && item.image.trim()) {
      return { uri: item.image };
    }

    return fallbackImageMap[item.id] || fallbackImageMap['coming-soon'];
  };

  const handlePress = (item: CategoryItem) => {
    if (item.id === 'coming-soon') return;

    router.push({
      pathname: '/category/[id]',
      params: {
        id: item.id,
        title: getLabel(item),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {categories.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => handlePress(item)}
        >
          <View style={styles.imageWrap}>
            <Image source={getImageSource(item)} style={styles.image} contentFit="cover" />
          </View>
          <ThemedText style={styles.label} numberOfLines={2}>
            {getLabel(item)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    marginBottom: 24,
  },
  item: {
    width: '22%',
    alignItems: 'center',
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#F4F4F4',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
    minHeight: 32,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});