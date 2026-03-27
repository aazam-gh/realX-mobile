import { collection, getFirestore, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type CategoryItem = {
  id: string;
  name?: string;
  name_en?: string;
  name_ar?: string;
  image?: string;
  imageUrl?: string;
  order?: number;
};

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

        setCategories(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const getLabel = (item: CategoryItem) => {
    if (i18n.language === 'ar') {
      return item.name_ar || item.name || item.name_en || t(item.id);
    }

    return item.name_en || item.name || t(item.id);
  };

  const getImageSource = (item: CategoryItem) => {
    const image = item.imageUrl || item.image;
    if (typeof image === 'string' && image.trim()) {
      return { uri: image };
    }
    return null;
  };

  const handlePress = (item: CategoryItem) => {
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
            {getImageSource(item) ? (
              <Image source={getImageSource(item)!} style={styles.image} contentFit="cover" />
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {getLabel(item)}
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4F4F4',
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
    minHeight: 32,
    color: '#000',
    fontFamily: Typography.poppins.medium,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
