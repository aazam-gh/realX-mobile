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
  PromoBanner,
  SearchBar,
  TrendingOffers,
  WaktiBanner
} from '../../components/home';

import { triggerSubtleHaptic } from '../../utils/haptics';
import { useStudent } from '../../context/StudentContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';

export default function HomeScreen() {
  const { studentData } = useStudent();
  const { isGuest } = useAuthAccess();
  const userName = studentData?.firstName || '';
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark, theme } = useAppTheme();

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
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        directionalLockEnabled
        contentContainerStyle={styles.contentContainer}
      >
        <GreetingHeader userName={isGuest ? t('guest_home_name') : (userName || t('user'))} />
        <SearchBar
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
        <View style={styles.glowSection}>
          <HomeRowGlow variant="promo" />
          <PromoBanner onBannerPress={(banner) => handleVendorPress(banner.vendorId)} />
        </View>
        <CategoryGrid />
        <View style={styles.glowSection}>
          <HomeRowGlow variant="offers" />
          <TrendingOffers onVendorPress={(vendor) => handleVendorPress(vendor.vendorId || vendor.id)} />
        </View>
        <BrandGrid />
        <FeaturedBanner />
        <WaktiBanner />
      </ScrollView>
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
  contentContainer: {
    // iOS tab bar is a translucent overlay so content needs clearance; the Android
    // JS tab bar reserves its own layout space, so a large pad just leaves dead space.
    paddingBottom: Platform.OS === 'ios' ? 88 : 24,
  },
  glowSection: {
    position: 'relative',
    overflow: 'visible',
  },
});
