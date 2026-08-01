import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  BrandGrid,
  CategoryGrid,
  FeaturedBanner,
  GreetingHeader,
  HomeRowGlow,
  OpportunityHighlights,
  PromoBanner,
  SearchBar,
  TrendingOffers,
  WaktiBanner
} from '../../components/home';

import { triggerSubtleHaptic } from '../../utils/haptics';
import { useStudent } from '../../context/StudentContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { queryClient } from '../../utils/queryClient';
import { useRealXRefresh } from '../../components/PullToRefresh';
import { useTabBarScrollVisibility } from '../../components/navigation/TabBarScrollVisibility';
import VerificationStatusBanner from '../../components/onboarding/VerificationStatusBanner';

export default function HomeScreen() {
  const { studentData } = useStudent();
  const { isGuest } = useAuthAccess();
  const userName = studentData?.firstName || '';
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

  const refreshHome = useCallback(async () => {
    await queryClient.refetchQueries({
      predicate: (query) => ['categories', 'cmsDocument', 'trendingOffers', 'vendor'].includes(String(query.queryKey[0])),
      type: 'active',
    });
  }, []);
  const { refreshControl, refreshOverlay } = useRealXRefresh({ onRefresh: refreshHome });
  const tabBarScrollVisibility = useTabBarScrollVisibility();

  const handleVendorPress = useCallback((vendorId?: string) => {
    const trimmedVendorId = vendorId?.trim();
    if (!trimmedVendorId) return;

    router.push({ pathname: '/vendor/[id]', params: { id: trimmedVendorId } });
  }, [router]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    triggerSubtleHaptic();
    router.push({ pathname: '/search', params: { q: trimmed } });
  }, [searchQuery, router]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.cardMuted }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.cardMuted}
      />
      <View style={styles.contentWrapper}>
        <ScrollView
          style={[styles.container, { backgroundColor: theme.background }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          directionalLockEnabled
          contentContainerStyle={styles.contentContainer}
          refreshControl={refreshControl}
          {...tabBarScrollVisibility}
        >
        <View style={[styles.headerSection, { backgroundColor: theme.cardMuted }]}>
          <GreetingHeader
            userName={isGuest ? t('guest_home_name') : (userName || t('user'))}
            savings={studentData?.savings ?? 0}
          />
        </View>
        <SearchBar
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
        <VerificationStatusBanner />
        <View style={styles.glowSection}>
          <HomeRowGlow variant="promo" />
          <PromoBanner onBannerPress={(banner) => handleVendorPress(banner.vendorId)} />
        </View>
        <CategoryGrid />
        <WaktiBanner />
        <View style={styles.glowSection}>
          <HomeRowGlow variant="offers" />
          <TrendingOffers onVendorPress={(vendor) => handleVendorPress(vendor.vendorId || vendor.id)} />
        </View>
        <FeaturedBanner />
        <BrandGrid />
        <OpportunityHighlights />
        </ScrollView>
        {refreshOverlay}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    // iOS tab bar is a translucent overlay so content needs clearance; the Android
    // JS tab bar reserves its own layout space, so a large pad just leaves dead space.
    paddingBottom: Platform.OS === 'ios' ? 88 : 24,
  },
  headerSection: {
    paddingBottom: 8,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  glowSection: {
    position: 'relative',
    overflow: 'visible',
  },
});
