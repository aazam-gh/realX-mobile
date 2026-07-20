import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ImageBackground, LayoutChangeEvent, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logger } from '../../utils/logger';
import { clearLocalAuthSession } from '../../utils/auth';
import { toArabicDigits } from '../../utils/numbers';
import { Typography } from '../../constants/Typography';
import AppText from '../../components/AppText';
import { useStudent } from '../../context/StudentContext';
import UserAvatar from '../../components/UserAvatar';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, theme } = useAppTheme();
  const { isRTL, locale, isChanging, changeLocale } = useAppLocale();
  const { studentData: userData } = useStudent();
  const { isGuest, endGuestSession } = useAuthAccess();
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <AppText
              style={[
                { color: theme.text, textAlign: isRTL ? 'right' : 'left' },
                styles.headerText,
              ]}
            >
              {t('profile')}
            </AppText>
          </View>

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
              source={require('../../assets/images/uni.png')}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <AppText
            style={[
              { color: theme.text, textAlign: isRTL ? 'right' : 'left' },
              styles.headerText,
            ]}
          >
            {t('profile')}
          </AppText>
        </View>

        <View style={[styles.topPill, { backgroundColor: theme.cardMuted }]}>
          <View style={styles.profileTopRow}>
            <UserAvatar
              firstName={userData?.firstName}
              lastName={userData?.lastName}
              email={userData?.email || getAuth().currentUser?.email}
              photoURL={userData?.photoURL || getAuth().currentUser?.photoURL}
              role={userData?.role}
              seed={getAuth().currentUser?.uid}
              size={80}
            />
            <View style={[styles.badge, { backgroundColor: theme.brand }]}>
              <AppText style={[{ color: '#FFFFFF', textAlign: isRTL ? 'right' : 'left' }, styles.badgeText]}>{t('rookie_badge')}</AppText>
            </View>
          </View>
        </View>

        <View style={[styles.bottomPill, { backgroundColor: theme.cardMuted }]}>
          <View style={styles.profileBottomRow}>
            <View style={[styles.userInfo, isRTL && styles.userInfoRTL]}>
              <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('body'), textAlign: isRTL ? 'right' : 'left' }, styles.userName]}>
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Darren Watkins'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => router.push('/profile-details')}
            >
              <Ionicons name="create-outline" size={16} color={theme.iconMuted} />
              <AppText style={[{ color: theme.text, textAlign: isRTL ? 'right' : 'left' }, styles.editButtonText]}>
                {t('profile')}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <AppText
            style={[
              { color: theme.text },
              styles.sectionTitle,
              { textTransform: isRTL ? 'none' : 'uppercase' },
              isRTL && styles.sectionTitleRTL,
            ]}
          >
            {t('savings_tracker')}
          </AppText>
        </View>

        <View style={[styles.savingsCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, isRTL && styles.savingsCardRTL]}>
          <Text
            style={[
              { color: theme.text, ...Typography.getTextVariantStyle('body') },
              styles.savingsLabel,
              isRTL && styles.savingsLabelRTL,
            ]}
          >
            {t('all_time_saved')}
          </Text>
          <View style={[styles.savingsAmountContainer, isRTL && styles.savingsAmountContainerRTL]}>
            <AppText style={[{ color: theme.brandText, textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }, styles.savingsAmountGreen]}>
              {t('amount_with_currency', { amount: isRTL ? toArabicDigits((userData?.savings ?? 0).toFixed(2)) : (userData?.savings ?? 0).toFixed(2), currency: t('currency_qar') })}
            </AppText>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.universityBanner} 
          onPress={() => router.push('/x-academy')}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={require('../../assets/images/uni.png')}
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
          <MenuItem icon="bookmark-outline" label={t('saved_offers')} onPress={() => router.push('/saved-offers' as any)} isRTL={isRTL} />
          <MenuItem icon="time-outline" label={t('redemption_history')} onPress={() => router.push('/redemption-history' as any)} isRTL={isRTL} />
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
    </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  headerRTL: {
    alignItems: 'flex-start',
  },
  headerText: {
    fontSize: 28,
    letterSpacing: 0.5,
  },
  topPill: {
    borderRadius: 30,
    padding: 8,
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
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  profileBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  userInfoRTL: {
    justifyContent: 'flex-start',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6,
  },
  editButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionHeaderRTL: {
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    textTransform: 'uppercase',
  },
  sectionTitleRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  savingsCard: {
    borderRadius: 32,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
  },
  savingsCardRTL: {
    alignItems: 'flex-start',
  },
  savingsLabel: {
    fontSize: 14,
    ...Typography.getTextVariantStyle('body'),
  },
  savingsLabelRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  savingsAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  savingsAmountContainerRTL: {
    alignSelf: 'flex-start',
  },
  savingsAmountGreen: {
    fontSize: 32,
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
