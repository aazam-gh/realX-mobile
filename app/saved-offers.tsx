import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { deleteDoc, doc, getFirestore } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import AppHeader from '../components/navigation/AppHeader';
import { StateSurface } from '../components/StateSurface';
import { useAppTheme } from '../context/AppThemeContext';
import { useAuthAccess } from '../context/AuthAccessContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useAppLocale } from '../context/LocaleContext';
import { Typography } from '../constants/Typography';
import { triggerSubtleHaptic } from '../utils/haptics';
import { logger } from '../utils/logger';
import { fetchSavedOffers, SavedOfferItem } from '../utils/firebaseQueries';
import { queryClient, queryKeys } from '../utils/queryClient';
import { useRealXRefresh } from '../components/PullToRefresh';

type SavedOffer = SavedOfferItem;

export default function SavedOffersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, theme } = useAppTheme();
  const { isAuthenticated, loading: authAccessLoading, requireAuth } = useAuthAccess();
  const { locale } = useAppLocale();
  const isArabic = locale === 'ar';
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const userId = getAuth().currentUser?.uid ?? null;

  useEffect(() => {
    if (authAccessLoading || isAuthenticated) return;
    requireAuth('guest_saved_offers_message');
    router.replace('/(tabs)/profile' as any);
  }, [authAccessLoading, isAuthenticated, requireAuth, router]);
  const {
    data: savedOffers = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: userId ? queryKeys.savedOffers(userId) : ['savedOffers', 'anonymous'],
    queryFn: () => userId ? fetchSavedOffers(userId) : Promise.resolve([]),
    enabled: !!userId,
  });
  const { isOnline } = useConnectivity();
  const { refreshControl, refreshOverlay } = useRealXRefresh({ onRefresh: refetch });

  useEffect(() => {
    if (error) logger.error('Error loading saved offers:', error);
  }, [error]);

  const removeSavedOffer = async (item: SavedOffer) => {
    const user = getAuth().currentUser;
    if (!user || removingIds.has(item.id)) return;

    setRemovingIds((previous) => new Set(previous).add(item.id));
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'students', user.uid, 'savedItems', item.id));
      queryClient.setQueryData<SavedOffer[]>(queryKeys.savedOffers(user.uid), (previous = []) => (
        previous.filter((offer) => offer.id !== item.id)
      ));
      await queryClient.invalidateQueries({ queryKey: queryKeys.savedOffers(user.uid) });
    } catch (error) {
      logger.error('Error removing saved offer:', error);
    } finally {
      setRemovingIds((previous) => {
        const next = new Set(previous);
        next.delete(item.id);
        return next;
      });
    }
  };

  const openVendor = (item: SavedOffer) => {
    triggerSubtleHaptic();
    router.push({ pathname: '/vendor/[id]', params: { id: item.vendorId } });
  };

  const redeemOffer = (item: SavedOffer) => {
    triggerSubtleHaptic();
    router.push(`/redeem/${item.vendorId}?vendorId=${item.vendorId}&offerIndex=${item.offerIndex}`);
  };

  const renderItem = ({ item }: { item: SavedOffer }) => {
    const title = isArabic ? (item.titleAr || item.titleEn || '') : (item.titleEn || item.titleAr || '');
    const vendorName = isArabic ? (item.vendorNameAr || item.vendorName || '') : (item.vendorName || item.vendorNameAr || '');
    const description = isArabic ? (item.descriptionAr || item.descriptionEn || '') : (item.descriptionEn || item.descriptionAr || '');

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.9}
        onPress={() => openVendor(item)}
      >
        <Image
          source={item.vendorCoverImage ? { uri: item.vendorCoverImage } : undefined}
          style={[styles.cover, { backgroundColor: theme.cardMuted }]}
          contentFit="cover"
        />
        <View style={[styles.content, isArabic && styles.rowReverse]}>
          <View style={[styles.logoWrap, { backgroundColor: theme.logoTile, borderColor: theme.logoTileBorder }]}>
            {item.vendorLogo ? (
              <Image source={{ uri: item.vendorLogo }} style={styles.logo} contentFit="cover" />
            ) : (
              <Ionicons name="storefront-outline" size={22} color={theme.brand} />
            )}
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.vendorName, { color: theme.mutedText, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={1}>
              {vendorName || t('unknown_vendor')}
            </Text>
            <AppText style={[styles.offerTitle, { color: theme.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={2}>
              {title || t('saved_offer')}
            </AppText>
            {description ? (
              <Text style={[styles.description, { color: theme.subtleText, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={2}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.actions, isArabic && styles.rowReverse]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.redeemButton, isArabic && styles.rowReverse, { backgroundColor: theme.actionSolid }]}
            onPress={() => redeemOffer(item)}
          >
            <Ionicons name="flash" size={18} color={theme.onActionSolid} />
            <Text style={[styles.redeemText, { color: theme.onActionSolid, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={1}>{t('redeem_caps')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.removeButton, isArabic && styles.rowReverse, { borderColor: theme.border }]}
            onPress={() => void removeSavedOffer(item)}
            disabled={removingIds.has(item.id)}
          >
            <Ionicons name="bookmark" size={18} color={theme.brand} />
            <Text style={[styles.removeText, { color: theme.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]} numberOfLines={1}>{t('remove')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} animated />
      <AppHeader title={t('saved_offers')} onBackPress={() => router.back()} />

      {authAccessLoading || (!isAuthenticated && !userId) ? (
        <StateSurface kind="loading" />
      ) : !!userId && isLoading ? (
        <StateSurface kind="loading" />
      ) : error && savedOffers.length === 0 ? (
        <StateSurface kind={isOnline ? 'error' : 'offline'} onRetry={() => void refetch()} />
      ) : savedOffers.length === 0 ? (
        <StateSurface kind="empty" title={t('no_saved_offers')} message={t('no_saved_offers_hint')} />
      ) : (
        <View style={styles.contentWrapper}>
          <FlatList
            data={savedOffers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          />
          {refreshOverlay}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 120,
    backgroundColor: '#F2F2F2',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  vendorName: {
    fontSize: 13,
    ...Typography.getTextVariantStyle('body'),
  },
  offerTitle: {
    fontSize: 20,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    ...Typography.getTextVariantStyle('body'),
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  redeemButton: {
  },
  redeemText: {
    flexShrink: 1,
    ...Typography.getTextVariantStyle('bodyStrong'),
    fontSize: 13,
  },
  removeButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  removeText: {
    flexShrink: 1,
    ...Typography.getTextVariantStyle('bodyStrong'),
    fontSize: 13,
  },
});
