import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getAuth } from '@react-native-firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/AppThemeContext';
import { useAuthAccess } from '../context/AuthAccessContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useAppLocale } from '../context/LocaleContext';
import { Typography } from '../constants/Typography';
import AppText from '../components/AppText';
import AppHeader from '../components/navigation/AppHeader';
import { StateSurface } from '../components/StateSurface';
import { triggerSubtleHaptic } from '../utils/haptics';
import { logger } from '../utils/logger';
import { toArabicDigits } from '../utils/numbers';
import { fetchRedemptionHistory, RedemptionHistoryTransaction } from '../utils/firebaseQueries';
import { queryKeys } from '../utils/queryClient';
import { useRealXRefresh } from '../components/PullToRefresh';

/*
  UI Format based on design specs:
  - Header: Left arrow, Title "Redemption History"
  - Card: 
    - Vendor image, Vendor Name, "Total Paid: XX QAR", "Estimated savings: YY QAR"
    - "Offer Redeemed": "ZZ% Student Discount", "Redeem Again" button
    - Bottom of card: "Redeemed on Jul 7 08:07 AM"
*/

type Transaction = RedemptionHistoryTransaction;

export default function RedemptionHistoryScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { isAuthenticated, loading: authAccessLoading, requireAuth } = useAuthAccess();
  const { locale } = useAppLocale();
  const isArabic = locale === 'ar';
  const currency = t('currency_qar');
  const fmt = (n: number, decimals = 0) => isArabic ? toArabicDigits(n.toFixed(decimals)) : n.toFixed(decimals);
  const router = useRouter();
  const userId = getAuth().currentUser?.uid ?? null;

  useEffect(() => {
    if (authAccessLoading || isAuthenticated) return;
    requireAuth('guest_history_message');
    router.replace('/(tabs)/profile' as any);
  }, [authAccessLoading, isAuthenticated, requireAuth, router]);
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: userId ? queryKeys.redemptionHistory(userId) : ['redemptionHistory', 'anonymous'],
    queryFn: () => userId ? fetchRedemptionHistory(userId) : Promise.resolve({ transactions: [], vendorLogos: {} }),
    enabled: !!userId,
  });
  const transactions = data?.transactions || [];
  const vendorLogos = data?.vendorLogos || {};
  const { isOnline } = useConnectivity();
  const { refreshControl, refreshOverlay } = useRealXRefresh({ onRefresh: refetch });

  useEffect(() => {
    if (error) logger.error('Error fetching redemptions:', error);
  }, [error]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const logoUri = vendorLogos[item.vendorId];
    const isOnlineRedemption = item.type === 'online_redemption';
    const savings = isOnlineRedemption ? 0 : item.discountAmount || 0;
    const paid = isOnlineRedemption ? 0 : item.finalAmount || 0;

    const discountText =
      isOnlineRedemption
        ? t('online_vendor_title')
        : item.offer?.discountType === 'buy1get1'
        ? t('buy1get1_label')
        : item.offer?.discountType && item.offer?.discountValue
        ? `${item.offer.discountValue}${item.offer.discountType === 'percentage' ? '%' : ''} OFF`
        : t('offer_redeemed_label');

    const dateValue = item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt;
    const dateStr = dateValue
      ? new Date(dateValue).toLocaleDateString(isArabic ? 'ar-QA' : 'en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <View style={{ marginBottom: 24 }}>
        <View style={[styles.card, { backgroundColor: theme.cardMuted }]}>
          <View style={styles.cardHeader}>
            <View style={styles.vendorInfo}>
              <View style={[styles.logoContainer, { backgroundColor: theme.logoTile, borderColor: theme.logoTileBorder }]}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logo} contentFit="contain" />
                ) : (
                  <Ionicons name="storefront" size={24} color={theme.iconMuted} />
                )}
              </View>
              <View style={styles.vendorTextContainer}>
                <Text style={[styles.vendorName, { color: theme.text }]} numberOfLines={1}>
                  {isArabic ? (item.vendorNameAr || item.vendorName || 'VENDOR') : (item.vendorName || 'VENDOR')}
                </Text>
                <Text style={[styles.savingsText, { color: theme.mutedText, writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={2}>
                  {t('estimated_savings', {
                    amount: t('amount_with_currency', { amount: fmt(savings), currency }),
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.paidInfo}>
              <Text style={[styles.paidLabel, { color: theme.mutedText }]} numberOfLines={1}>{t('total_paid')}</Text>
              <AppText style={[styles.paidAmount, { color: theme.text, writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={1}>
                {t('amount_with_currency', { amount: fmt(paid), currency })}
              </AppText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.cardFooter}>
            <View style={styles.offerInfo}>
              <Text style={[styles.offerLabel, { color: theme.mutedText }]} numberOfLines={1}>{t('offer_redeemed_label')}</Text>
              <Text style={[styles.offerValue, { color: theme.text, writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={1}>
                {discountText}
              </Text>
            </View>

            {item.vendorId && (
              <TouchableOpacity
                style={[styles.redeemButton, { backgroundColor: theme.actionSolid }]}
                activeOpacity={0.8}
                onPress={() => {
                  triggerSubtleHaptic();
                  router.push({
                    pathname: '/vendor/[id]',
                    params: { id: item.vendorId },
                  });
                }}
              >
                <Text style={[styles.redeemButtonText, { color: theme.onActionSolid }]} numberOfLines={1}>{t('redeem_again')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.dateText, { color: theme.mutedText, writingDirection: isArabic ? 'rtl' : 'ltr' }]}>{t('redeemed_on', { date: dateStr })}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <AppHeader title={t('redemption_history')} onBackPress={() => router.back()} />

        {authAccessLoading || (!isAuthenticated && !userId) ? (
        <StateSurface kind="loading" />
      ) : !!userId && isLoading ? (
        <StateSurface kind="loading" />
      ) : error && transactions.length === 0 ? (
        <StateSurface kind={isOnline ? 'error' : 'offline'} onRetry={() => void refetch()} />
      ) : (
        <View style={styles.contentWrapper}>
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            ListEmptyComponent={<StateSurface kind="empty" title={t('no_redemptions_found')} />}
          />
          {refreshOverlay}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  vendorTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  vendorName: {
    fontSize: 18,
    ...Typography.getTextVariantStyle('bodyStrong'),
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    ...Typography.getTextVariantStyle('body'),
  },
  paidInfo: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '42%',
  },
  paidLabel: {
    fontSize: 12,
    ...Typography.getTextVariantStyle('body'),
    marginBottom: 4,
  },
  paidAmount: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  offerInfo: {
    flex: 1,
    minWidth: 0,
  },
  offerLabel: {
    fontSize: 12,
    ...Typography.getTextVariantStyle('body'),
    marginBottom: 4,
  },
  offerValue: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  redeemButton: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  redeemButtonText: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  dateText: {
    fontSize: 12,
    ...Typography.getTextVariantStyle('body'),
    marginLeft: 8,
  },
});
