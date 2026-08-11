import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  BrandGrid,
  CategoryGrid,
  FeaturedBanner,
  GreetingHeader,
  NewDeals,
  OpportunityHighlights,
  PromoBanner,
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
  const { t } = useTranslation();
  const userName = isGuest ? t('guest_home_name') : (studentData?.firstName || t('user'));
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const isFocused = useIsFocused();
  const { isDark, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hiddenStatusBarInset = Platform.OS === 'android'
    ? NativeStatusBar.currentHeight ?? 24
    : insets.top;

  const refreshHome = useCallback(async () => {
    await queryClient.refetchQueries({
      predicate: (query) => ['categories', 'cmsDocument', 'newDeals', 'trendingOffers', 'vendor'].includes(String(query.queryKey[0])),
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
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['bottom']}>
      {isFocused ? (
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          animated
        />
      ) : null}
      <View
        pointerEvents="none"
        style={{ height: hiddenStatusBarInset, backgroundColor: theme.background }}
      />
      <View collapsable={false} style={styles.contentWrapper}>
        <ScrollView
          style={[styles.container, { backgroundColor: theme.background }]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          directionalLockEnabled
          contentContainerStyle={styles.contentContainer}
          refreshControl={refreshControl}
          {...tabBarScrollVisibility}
        >
        <VerificationStatusBanner />
        <PromoBanner onBannerPress={(banner) => handleVendorPress(banner.vendorId)} />
        <CategoryGrid />
        <WaktiBanner />
        <TrendingOffers onVendorPress={(vendor) => handleVendorPress(vendor.vendorId || vendor.id)} />
        <BrandGrid />
        <FeaturedBanner />
        <NewDeals onVendorPress={(vendor) => handleVendorPress(vendor.vendorId || vendor.id)} />
        <OpportunityHighlights />
        </ScrollView>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.background, borderBottomColor: theme.border },
          ]}
        >
          <GreetingHeader
            userName={userName}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearch}
          />
        </View>
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
    paddingTop: 68,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
