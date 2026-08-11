import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  HelpLink,
  HowItWorksDrawer,
  RewardsTermsDrawer,
  RecentRedemptions,
  SpendButton,
  SpendCardDrawer,
  XCard,
} from '../../components/wallet';
import { useStudent } from '../../context/StudentContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { Typography } from '../../constants/Typography';
import { queryClient } from '../../utils/queryClient';
import { useRealXRefresh } from '../../components/PullToRefresh';
import { useTabBarScrollVisibility } from '../../components/navigation/TabBarScrollVisibility';

export default function WalletScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const { studentData } = useStudent();
  const { isDark, theme } = useAppTheme();
  const { isGuest, endGuestSession, requireAuth } = useAuthAccess();
  const balance = typeof studentData?.cashback === 'number' ? studentData.cashback : 0;
  const creatorCode = studentData?.creatorCode;
  const currency = 'XP';
  const androidTopInset = Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 24 : 0;

  const [isHelpDrawerVisible, setIsHelpDrawerVisible] = useState(false);
  const [isRewardsTermsDrawerVisible, setIsRewardsTermsDrawerVisible] = useState(false);
  const [isSpendDrawerVisible, setIsSpendDrawerVisible] = useState(false);
  const refreshWallet = async () => {
    await queryClient.refetchQueries({ type: 'active' });
  };
  const { refreshControl, refreshOverlay } = useRealXRefresh({ onRefresh: refreshWallet });
  const tabBarScrollVisibility = useTabBarScrollVisibility();

  const handleSpendPress = () => {
    if (isGuest && !requireAuth('guest_spend_message')) return;
    setIsSpendDrawerVisible(true);
  };

  const handleSpendDrawerClose = () => {
    setIsSpendDrawerVisible(false);
  };

  const handleHelpPress = () => {
    setIsHelpDrawerVisible(true);
  };

  const handleHelpDrawerClose = () => {
    setIsHelpDrawerVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isFocused ? (
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          animated
        />
      ) : null}
      <View collapsable={false} style={[styles.contentWrapper, { paddingTop: androidTopInset }]}>
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          {...tabBarScrollVisibility}
        >
        <XCard earnings={isGuest ? 0 : balance} currency={currency} creatorCode={isGuest ? undefined : creatorCode} />
        <SpendButton
          onPress={handleSpendPress}
          label={isGuest ? t('guest_wallet_cta') : undefined}
          leadingIcon={isGuest ? 'log-in-outline' : undefined}
        />
        <HelpLink
          onPress={handleHelpPress}
          onTermsPress={() => setIsRewardsTermsDrawerVisible(true)}
        />
        {isGuest ? (
          <View style={[styles.guestCard, { backgroundColor: theme.cardMuted }]}>
            <Text style={[styles.guestTitle, { color: theme.text }]}>
              {t('guest_wallet_title')}
            </Text>
            <Text style={[styles.guestBody, { color: theme.mutedText }]}>
              {t('guest_wallet_body')}
            </Text>
            <View style={styles.guestActions}>
              <TouchableOpacity
                style={[styles.guestPrimaryButton, { backgroundColor: theme.actionSolid }]}
                onPress={() => {
                  void endGuestSession().finally(() => router.push('/(onboarding)/login' as any));
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.guestPrimaryText, { color: theme.onActionSolid }]}>
                  {t('onboarding_login_action')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestSecondaryButton, { borderColor: theme.border }]}
                onPress={() => {
                  void endGuestSession().finally(() => router.push('/(onboarding)' as any));
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.guestSecondaryText, { color: theme.text }]}>
                  {t('onboarding_sign_up')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <RecentRedemptions />
        )}
        </ScrollView>
        {refreshOverlay}
      </View>

      <HowItWorksDrawer
        visible={isHelpDrawerVisible}
        onClose={handleHelpDrawerClose}
      />

      <RewardsTermsDrawer
        visible={isRewardsTermsDrawerVisible}
        onClose={() => setIsRewardsTermsDrawerVisible(false)}
      />

      <SpendCardDrawer
        visible={isSpendDrawerVisible}
        onClose={handleSpendDrawerClose}
        balance={balance}
        currency={currency}
      />
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  guestCard: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  guestTitle: {
    fontSize: 20,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  guestBody: {
    fontSize: 14,
    lineHeight: 20,
    ...Typography.getTextVariantStyle('body'),
  },
  guestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  guestPrimaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSecondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrimaryText: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  guestSecondaryText: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
});
