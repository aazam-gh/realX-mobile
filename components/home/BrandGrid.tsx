import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../ThemedText';

const brands = [
  require('../../assets/images/coffee.png'),
  require('../../assets/images/food.png'),
  require('../../assets/images/grocery.png'),
  require('../../assets/images/food.png'),
  require('../../assets/images/coffee.png'),
];

export default function BrandGrid() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{t('shop_by_brand')}</ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {brands.map((brand, index) => (
          <View key={index} style={styles.brandCard}>
            <Image source={brand} style={styles.image} contentFit="cover" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    marginBottom: 14,
  },
  row: {
    gap: 12,
    paddingRight: 6,
  },
  brandCard: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
