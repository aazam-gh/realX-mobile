import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingField, OnboardingPrimaryButton, OnboardingScaffold } from '../../components/onboarding/OnboardingUI';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { logger } from '../../utils/logger';
import { getOnboardingErrorKey, isValidEmail, normalizeEmail, trackOnboarding } from '../../utils/onboarding';

export default function VerificationIntroScreen() {
  const router = useRouter();
  const { email: initialEmail, role } = useLocalSearchParams<{ email?: string; role?: string }>();
  const [email, setEmail] = useState(initialEmail || '');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { continueAsGuest } = useAuthAccess();
  const { isOnline } = useConnectivity();

  const sendVerificationCode = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setErrorKey('onboarding_error_email_invalid');
      return;
    }
    if (!isOnline) {
      setErrorKey('onboarding_error_network');
      return;
    }

    setLoading(true);
    setErrorKey(null);
    try {
      const sendOtp = httpsCallable(getFunctions(undefined, 'me-central1'), 'sendOtp');
      await sendOtp({ email: normalizedEmail, purpose: 'verification' });
      void trackOnboarding('auth_code_sent', { auth_mode: 'signup', verification_method: 'student_id' });
      router.push({ pathname: '/(onboarding)/verify', params: { email: normalizedEmail, purpose: 'verification', role: role || 'student' } });
    } catch (error) {
      logger.error('Unable to send student ID verification code', error);
      const nextErrorKey = getOnboardingErrorKey(error);
      setErrorKey(nextErrorKey);
      void trackOnboarding('auth_error_shown', { step: 'verification_email', error_code: nextErrorKey, recoverable: true });
    } finally {
      setLoading(false);
    }
  };

  return <OnboardingScaffold title={t('onboarding_v2_manual_email_title')} subtitle={t('onboarding_v2_manual_email_subtitle')} onBack={() => router.back()} onClose={() => router.replace('/(onboarding)' as any)} progress={{ current: 2, total: 5 }} footer={<OnboardingPrimaryButton label={t('onboarding_email_continue')} loadingLabel={t('onboarding_v2_checking_email')} loading={loading} disabled={!isValidEmail(email)} onPress={() => void sendVerificationCode()} />}>
    <OnboardingField
      autoCapitalize="none"
      autoCorrect={false}
      editable={!loading}
      error={errorKey ? t(errorKey) : null}
      keyboardType="email-address"
      label={t('onboarding_account_email_placeholder')}
      onChangeText={(value) => { setEmail(value); setErrorKey(null); }}
      placeholder={t('onboarding_account_email_placeholder')}
      returnKeyType="send"
      onSubmitEditing={() => void sendVerificationCode()}
      style={{ writingDirection: 'ltr', textAlign: 'left' }}
      textContentType="emailAddress"
      value={email}
    />
    <View style={styles.steps}>{[1, 2, 3].map((step) => <View key={step} style={styles.step}>
      <View style={styles.stepCopy}><Text style={[styles.stepTitle, { color: theme.text }]}>{t(`onboarding_v2_verification_step_${step}`)}</Text><Text style={[styles.stepBody, { color: theme.mutedText }]}>{t(`onboarding_v2_verification_step_${step}_body`)}</Text></View>
    </View>)}</View>
    <View style={[styles.privacy, { backgroundColor: theme.cardMuted }]}><Text style={[styles.privacyText, { color: theme.text }]}>{t('onboarding_v2_verification_privacy')}</Text></View>
    <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/privacy' as any)} style={styles.link}><Text style={[styles.linkText, { color: theme.brandText }]}>{t('privacy_policy')}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={() => void continueAsGuest()} style={styles.link}><Text style={[styles.linkText, { color: theme.mutedText }]}>{t('onboarding_v2_not_now')}</Text></TouchableOpacity>
  </OnboardingScaffold>;
}

const styles = StyleSheet.create({
  steps: { gap: 18 }, step: { flexDirection: 'row', alignItems: 'flex-start' }, stepCopy: { flex: 1 },
  stepTitle: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 15 }, stepBody: { ...Typography.getTextVariantStyle('body'), fontSize: 13, lineHeight: 19, paddingTop: 3 },
  privacy: { borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, privacyText: { flex: 1, ...Typography.getTextVariantStyle('body'), fontSize: 13, lineHeight: 19 },
  link: { minHeight: 44, justifyContent: 'center', alignItems: 'center' }, linkText: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 14 },
});
