import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ImageBackground, LayoutChangeEvent, Linking, Platform, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { logger } from '../../utils/logger';
import { clearLocalAuthSession } from '../../utils/auth';
import { toArabicDigits } from '../../utils/numbers';
import { Typography } from '../../constants/Typography';
import AppText from '../../components/AppText';
import ResponsiveText from '../../components/ResponsiveText';
import { useStudent } from '../../context/StudentContext';
import UserAvatar from '../../components/UserAvatar';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { useTabBarScrollVisibility } from '../../components/navigation/TabBarScrollVisibility';

export default function ProfileScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const { isDark, theme } = useAppTheme();
  const { isRTL, locale, isChanging, changeLocale } = useAppLocale();
  const { studentData: userData } = useStudent();
  const { isGuest, endGuestSession } = useAuthAccess();
  const tabBarScrollVisibility = useTabBarScrollVisibility();
  const savings = userData?.savings ?? 0;
  const savingsAmount = Number.isInteger(savings) ? savings.toFixed(0) : savings.toFixed(2);
  const formattedSavingsAmount = isRTL ? toArabicDigits(savingsAmount) : savingsAmount;
  const androidTopInset = Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 24 : 0;
  const changeLanguage = async (nextLocale: 'en' | 'ar') => {
    try {
      await changeLocale(nextLocale);
    } catch {
      Alert.alert(t('error'), t('language_change_failed'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout_title'),
      t('logout_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('log_out'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (getAuth().currentUser) {
                await clearLocalAuthSession();
              }
            } catch (error) {
              logger.error('Logout error:', error);
              Alert.alert(t('error'), t('logout_failed'));
            }
          },
        },
      ]
    );
  };

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {isFocused ? <StatusBar style={isDark ? 'light' : 'dark'} animated /> : null}
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 14 + androidTopInset }]}
          {...tabBarScrollVisibility}
        >
          <View style={[styles.topPill, { backgroundColor: theme.cardMuted }]}>
            <View style={styles.profileTopRow}>
              <UserAvatar
                firstName={t('guest_home_name')}
                email={t('guest_profile_email')}
                size={80}
              />
              <View style={[styles.badge, { backgroundColor: theme.brand }]}>
                <AppText style={[{ color: '#FFFFFF', textAlign: isRTL ? 'right' : 'left' }, styles.badgeText]}>{t('guest_badge')}</AppText>
              </View>
            </View>
          </View>

          <View style={[styles.bottomPill, { backgroundColor: theme.cardMuted }]}>
            <View style={[styles.guestProfileContent, isRTL && styles.guestProfileContentRTL]}>
              <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('body'), textAlign: isRTL ? 'right' : 'left' }, styles.userName]}>
                {t('guest_profile_title')}
              </Text>
              <Text style={[styles.guestProfileBody, { color: theme.mutedText, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('guest_profile_body')}
              </Text>
              <View style={[styles.guestProfileActions, isRTL && styles.guestProfileActionsRTL]}>
                <TouchableOpacity
                  style={[styles.guestPrimaryAction, { backgroundColor: theme.actionSolid }]}
                  onPress={() => {
                    void endGuestSession().finally(() => router.push('/(onboarding)/login' as any));
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.guestPrimaryActionText, { color: theme.onActionSolid }]}>{t('onboarding_login_action')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.guestSecondaryAction, { borderColor: theme.border }]}
                  onPress={() => {
                    void endGuestSession().finally(() => router.push('/(onboarding)' as any));
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.guestSecondaryActionText, { color: theme.text }]}>{t('onboarding_sign_up')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.universityBanner}
            onPress={() => router.push('/x-academy')}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={require('../../assets/images/uni.webp')}
              style={styles.universityBannerBg}
              imageStyle={{ borderRadius: 20 }}
            >
              <View style={styles.universityBannerOverlay}>
                <View style={[styles.onlyOnRealxBadge, isRTL && styles.badgeRTL]}>
                  <AppText style={styles.onlyOnRealxText}>{t('only_on_realx')}</AppText>
                </View>
                <View style={styles.universityBannerTitleRow}>
                  <AppText style={[styles.universityBannerTitle, isRTL && styles.universityBannerTitleRTL]}>
                    {t('apply_to_universities')}
                  </AppText>
                </View>
                <TouchableOpacity
                  style={[styles.universityBannerButton, { backgroundColor: theme.logoTile }]}
                  onPress={() => router.push('/x-academy')}
                  activeOpacity={0.8}
                >
                  <AppText style={[styles.universityBannerButtonText, { color: theme.logoTileText }]}>{t('apply_now')}</AppText>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.menuContainer}>
            <LanguageToggle
              locale={locale}
              englishLabel={t('english')}
              arabicLabel={t('arabic')}
              onChange={(nextLocale) => void changeLanguage(nextLocale)}
              disabled={isChanging}
            />
            <MenuItem
              icon="mail-outline"
              label={t('contact_us')}
              onPress={() => Linking.openURL('mailto:info@realx.qa')}
              isRTL={isRTL}
            />
            <MenuItem
              icon="document-text-outline"
              label={t('terms_and_conditions')}
              onPress={() => router.push('/terms')}
              isRTL={isRTL}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label={t('privacy_policy')}
              onPress={() => router.push('/privacy')}
              isRTL={isRTL}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isFocused ? <StatusBar style={isDark ? 'light' : 'dark'} animated /> : null}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 14 + androidTopInset }]}
        {...tabBarScrollVisibility}
      >
        <View style={[styles.savingsCard, { backgroundColor: theme.surfaceElevated }]}>
          <View style={[styles.profileSavingsRow, isRTL && styles.profileSavingsRowRTL]}>
              <View style={[styles.savingsDetails, { borderColor: theme.border }, isRTL && styles.savingsDetailsRTL]}>
                <View style={[styles.savingsInline, isRTL && styles.savingsInlineRTL]}>
                  <ResponsiveText style={[styles.savingsValueText, { color: theme.brandText }]} minimumFontScale={0.7}>
                    {formattedSavingsAmount}
                  </ResponsiveText>
                  <ResponsiveText style={[styles.savingsValueText, { color: theme.text }]} minimumFontScale={0.7}>
                    {t('savings_saved_label')}
                  </ResponsiveText>
                </View>
            </View>
            <TouchableOpacity
              style={styles.profileAvatarButton}
              onPress={() => router.push('/profile-details')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('profile')}
            >
              <UserAvatar
                firstName={userData?.firstName}
                lastName={userData?.lastName}
                email={userData?.email || getAuth().currentUser?.email}
                photoURL={userData?.photoURL || getAuth().currentUser?.photoURL}
                role={userData?.role}
                seed={getAuth().currentUser?.uid}
                size={60}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.universityBanner} 
          onPress={() => router.push('/x-academy')}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={require('../../assets/images/uni.webp')}
            style={styles.universityBannerBg}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.universityBannerOverlay}>
              <View style={[styles.onlyOnRealxBadge, isRTL && styles.badgeRTL]}>
                <AppText style={styles.onlyOnRealxText}>{t('only_on_realx')}</AppText>
              </View>
              
              <View style={styles.universityBannerTitleRow}>
                <ResponsiveText style={[styles.universityBannerTitle, isRTL && styles.universityBannerTitleRTL]}>
                  {t('apply_to_universities')}
                </ResponsiveText>
              </View>
              
              <TouchableOpacity
                style={[styles.universityBannerButton, { backgroundColor: theme.logoTile }]}
                onPress={() => router.push('/x-academy')}
                activeOpacity={0.8}
              >
                <AppText style={[styles.universityBannerButtonText, { color: theme.logoTileText }]}>{t('apply_now')}</AppText>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <View style={styles.menuContainer}>
          <MenuItem
            icon="bookmark-outline"
            label={t('saved_offers')}
            onPress={() => router.push('/saved-offers' as any)}
            isRTL={isRTL}
          />
          <MenuItem
            icon="time-outline"
            label={t('redemption_history')}
            onPress={() => router.push('/redemption-history' as any)}
            isRTL={isRTL}
          />
          <LanguageToggle
            locale={locale}
            englishLabel={t('english')}
            arabicLabel={t('arabic')}
            onChange={(nextLocale) => void changeLanguage(nextLocale)}
            disabled={isChanging}
          />
          <MenuItem
            icon="mail-outline"
            label={t('contact_us')}
            onPress={() => Linking.openURL('mailto:info@realx.qa')}
            isRTL={isRTL}
          />
          <MenuItem
            icon="document-text-outline"
            label={t('terms_and_conditions')}
            onPress={() => router.push('/terms')}
            isRTL={isRTL}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label={t('privacy_policy')}
            onPress={() => router.push('/privacy')}
            isRTL={isRTL}
          />
          <TouchableOpacity
            style={[styles.logoutPill, { backgroundColor: isDark ? 'rgba(255,107,95,0.12)' : '#FFF1F0', borderColor: theme.danger }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.logoutContent]}> 
              <Ionicons name="log-out-outline" size={20} color={theme.danger} />
              <AppText style={[styles.logoutText, { color: theme.danger, textAlign: isRTL ? 'right' : 'left' }]}>{t('log_out').toUpperCase()}</AppText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function LanguageToggle({
  locale,
  englishLabel,
  arabicLabel,
  onChange,
  disabled,
}: {
  locale: 'en' | 'ar';
  englishLabel: string;
  arabicLabel: string;
  onChange: (nextLocale: 'en' | 'ar') => void;
  disabled: boolean;
}) {
  const { theme } = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbOffset = useSharedValue(0);
  const thumbWidth = Math.max((trackWidth - 8) / 2, 0);

  useEffect(() => {
    if (!thumbWidth) return;

    thumbOffset.value = withTiming(locale === 'en' ? 0 : thumbWidth, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [locale, thumbOffset, thumbWidth]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbOffset.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.languageToggle, { backgroundColor: theme.cardMuted, direction: 'ltr' }, disabled && styles.languageToggleDisabled]}
      onLayout={handleLayout}
      accessibilityRole="radiogroup"
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.languageToggleThumb, { width: thumbWidth, backgroundColor: theme.brand }, thumbStyle]}
      />
      <TouchableOpacity
        style={styles.languageToggleOption}
        onPress={() => onChange('en')}
        disabled={disabled || locale === 'en'}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityLabel={englishLabel}
        accessibilityState={{ selected: locale === 'en', disabled }}
      >
        <Text style={[styles.languageToggleLabel, { color: locale === 'en' ? '#FFFFFF' : theme.text }]}>
          {englishLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.languageToggleOption}
        onPress={() => onChange('ar')}
        disabled={disabled || locale === 'ar'}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityLabel={arabicLabel}
        accessibilityState={{ selected: locale === 'ar', disabled }}
      >
        <Text style={[styles.languageToggleLabel, { color: locale === 'ar' ? '#FFFFFF' : theme.text }]}>
          {arabicLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  color,
  bgColor,
  isRTL,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
  bgColor?: string;
  isRTL: boolean;
  disabled?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: bgColor || theme.cardMuted },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.menuItemLeft]}>
        <Ionicons name={icon} size={24} color={color || theme.icon} />
        <Text
          style={[
            { color: color || theme.text, ...Typography.getTextVariantStyle('body') },
            styles.menuItemLabel,
            { textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 100,
  },
  topPill: {
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
  },
  bottomPill: {
    borderRadius: 30,
    paddingVertical: 24,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSavingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileSavingsRowRTL: {
    flexDirection: 'row-reverse',
  },
  savingsDetails: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  savingsDetailsRTL: {
    direction: 'rtl',
    justifyContent: 'center',
  },
  profileAvatarButton: {
    borderRadius: 30,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  userName: {
    fontSize: 20,
    ...Typography.getTextVariantStyle('bodyStrong'),
    paddingHorizontal: 4,
  },
  guestProfileContent: {
    gap: 12,
    paddingHorizontal: 8,
  },
  guestProfileContentRTL: {
    alignItems: 'flex-start',
  },
  guestProfileBody: {
    fontSize: 14,
    lineHeight: 20,
    ...Typography.getTextVariantStyle('body'),
  },
  guestProfileActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  guestProfileActionsRTL: {
    flexDirection: 'row-reverse',
  },
  guestPrimaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSecondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrimaryActionText: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  guestSecondaryActionText: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  savingsCard: {
    borderRadius: 32,
    padding: 0,
    marginBottom: 16,
  },
  savingsInline: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    lineHeight: 30,
  },
  savingsInlineRTL: {
    flexDirection: 'row-reverse',
  },
  savingsValueText: {
    flexShrink: 1,
    fontSize: 24,
    lineHeight: 32,
  },
  universityBanner: {
    marginBottom: 24,
    borderRadius: 30,
    overflow: 'hidden',
    height: 160,
  },
  universityBannerBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  universityBannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(100, 20, 20, 0.5)',
    padding: 16,
    justifyContent: 'space-between',
  },
  onlyOnRealxBadge: {
    backgroundColor: '#1AD04F',
    alignSelf: 'flex-end',
    marginTop: -18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRTL: {
    alignSelf: 'flex-start',
  },
  onlyOnRealxText: {
    color: '#FFF',
    fontSize: 10,
  },
  universityBannerTitle: {
    color: '#FFF',
    fontSize: 22,
    marginTop: -16,
    marginBottom: 8,
    lineHeight: 24,
  },
  universityBannerTitleRow: {
    width: '100%',
    alignItems: 'flex-start',
  },
  universityBannerTitleRTL: {
    writingDirection: 'rtl',
  },
  universityBannerButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  universityBannerButtonText: {
    fontSize: 16,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemLabel: {
    fontSize: 16,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  languageToggle: {
    minHeight: 64,
    borderRadius: 32,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  languageToggleDisabled: {
    opacity: 0.65,
  },
  languageToggleThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 28,
  },
  languageToggleOption: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageToggleLabel: {
    fontSize: 16,
    textAlign: 'center',
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  logoutPill: {
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
  },
});
