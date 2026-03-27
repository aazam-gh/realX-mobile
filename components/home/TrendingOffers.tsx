import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '../ThemedText';

const fallbackOffers = (t: (key: string) => string) => [
  { id: '1', title: t('restaurant_deal'), subtitle: t('up_to_30_off') },
  { id: '2', title: t('coffee_shop'), subtitle: t('buy_1_get_1_free') },
  { id: '3', title: t('grocery_store'), subtitle: t('fresh_deals_daily') },
];

export default function TrendingOffers() {
  const { t } = useTranslation();
  const offers = fallbackOffers(t);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{t('trending_offers')}</ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {offers.map((offer) => (
          <TouchableOpacity key={offer.id} style={styles.card} activeOpacity={0.8}>
            <View style={styles.badge} />
            <ThemedText style={styles.offerTitle} numberOfLines={1}>
              {offer.title}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.offerSubtitle} numberOfLines={1}>
              {offer.subtitle}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    marginBottom: 14,
  },
  row: {
    gap: 12,
    paddingRight: 6,
  },
  card: {
    width: 160,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    padding: 14,
    justifyContent: 'flex-end',
    minHeight: 140,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0C27B',
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
  },
});