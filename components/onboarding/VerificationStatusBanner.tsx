import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { getPendingVerification, type PendingVerificationData } from '../../utils/verificationPending';

export default function VerificationStatusBanner() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { endGuestSession } = useAuthAccess();
  const [pending, setPending] = useState<PendingVerificationData | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    void getPendingVerification().then((value) => {
      if (active) setPending(value);
    });
    return () => { active = false; };
  }, []));

  if (!pending) return null;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityHint={t('onboarding_pending_check_status')}
      style={[styles.banner, { backgroundColor: theme.brandSoft, borderColor: theme.brand }]}
      onPress={() => void endGuestSession().finally(() => {
        router.push({
          pathname: '/(onboarding)/pending',
          params: pending,
        } as any);
      })}
    >
      <Ionicons name="time-outline" size={22} color={theme.brand} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.brandText }]}>{t('onboarding_pending_banner_title')}</Text>
        <Text style={[styles.message, { color: theme.mutedText }]}>{t('onboarding_pending_banner_message')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.brand} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, borderWidth: 1, minHeight: 72, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1 },
  title: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 14, lineHeight: 19 },
  message: { ...Typography.getTextVariantStyle('body'), fontSize: 12, lineHeight: 17, marginTop: 2 },
});
