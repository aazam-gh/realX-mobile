import { getAuth, signInWithCustomToken } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InlineNotice, OnboardingPrimaryButton, OnboardingScaffold } from '../../components/onboarding/OnboardingUI';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { clearPendingVerificationForEmail } from '../../utils/verificationPending';
import { getOnboardingErrorKey } from '../../utils/onboarding';
import { logger } from '../../utils/logger';

const OTP_LENGTH = 6;

function OtpCodeField({ value, onChange, disabled, error }: { value: string; onChange: (value: string) => void; disabled: boolean; error?: string | null }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  return <View>
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.cells}>{Array.from({ length: OTP_LENGTH }).map((_, index) => <View key={index} style={[styles.cell, { backgroundColor: value[index] ? theme.brandSoft : theme.cardMuted, borderColor: error ? theme.danger : index === value.length ? theme.brand : theme.border }]}><Text style={[styles.digit, { color: theme.text }]}>{value[index] || ''}</Text></View>)}</View>
    </TouchableOpacity>
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, OTP_LENGTH))}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="one-time-code"
      maxLength={OTP_LENGTH}
      autoFocus
      editable={!disabled}
      caretHidden
      style={styles.logicalInput}
      accessibilityLabel={t('onboarding_v2_otp_accessibility')}
      accessibilityValue={{ text: value }}
    />
  </View>;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email, purpose, role } = useLocalSearchParams<{ email?: string; purpose?: 'signup' | 'login' | 'verification'; role?: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { isOnline } = useConnectivity();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const autoSubmitted = useRef('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = useCallback(async () => {
    if (code.length !== OTP_LENGTH || !email || !purpose || loading || !isOnline) {
      if (!isOnline) setErrorKey('onboarding_error_network');
      return;
    }
    setLoading(true); setErrorKey(null);
    try {
      const functions = getFunctions(undefined, 'me-central1');
      const verifyOtp = httpsCallable(functions, 'verifyOtp');
      const result = await verifyOtp({ email, code, purpose });
      if (purpose === 'verification') {
        router.replace({ pathname: '/(onboarding)/upload-id', params: { email, role: role || 'student' } });
        return;
      }
      const { customToken } = result.data as { customToken: string };
      await signInWithCustomToken(getAuth(), customToken);
      await clearPendingVerificationForEmail(email);
      if (purpose === 'signup' || role) router.replace({ pathname: '/(onboarding)/details', params: { email, role: role || 'student' } });
    } catch (error) {
      logger.error('Unable to verify onboarding code', error);
      const key = getOnboardingErrorKey(error);
      setErrorKey(key);
      autoSubmitted.current = '';
    } finally { setLoading(false); }
  }, [code, email, isOnline, loading, purpose, role, router]);

  useEffect(() => {
    if (code.length === OTP_LENGTH && code !== autoSubmitted.current) {
      autoSubmitted.current = code;
      void verify();
    }
  }, [code, verify]);

  const resend = async () => {
    if (!email || !purpose || cooldown > 0 || resending) return;
    if (!isOnline) { setErrorKey('onboarding_error_network'); return; }
    setResending(true); setErrorKey(null); setCode(''); autoSubmitted.current = '';
    try {
      const sendOtp = httpsCallable(getFunctions(undefined, 'me-central1'), 'sendOtp');
      await sendOtp({ email, purpose });
      setCooldown(60);
    } catch (error) { setErrorKey(getOnboardingErrorKey(error)); } finally { setResending(false); }
  };

  const editEmail = () => purpose === 'verification'
    ? router.replace({ pathname: '/(onboarding)/verification-intro', params: { email, role: role || 'student' } })
    : router.replace({ pathname: '/(onboarding)/email', params: { mode: purpose === 'login' ? 'login' : 'signup', prefillEmail: email, role } });

  return <OnboardingScaffold
    title={t('onboarding_v2_code_title')}
    subtitle={t('onboarding_v2_code_subtitle')}
    onBack={editEmail}
    onClose={() => router.replace('/(onboarding)' as any)}
    progress={purpose === 'login' ? undefined : purpose === 'verification' ? { current: 3, total: 5 } : { current: 3, total: 4 }}
    footer={<OnboardingPrimaryButton label={t('onboarding_otp_verify_button')} loading={loading} disabled={code.length !== OTP_LENGTH} onPress={() => void verify()} />}
  >
    {email ? <View style={styles.emailRow}><Text selectable style={[styles.email, { color: theme.text }]}>{email}</Text><TouchableOpacity accessibilityRole="button" onPress={editEmail} style={styles.textAction}><Text style={[styles.actionText, { color: theme.brandText }]}>{t('onboarding_otp_change_email')}</Text></TouchableOpacity></View> : null}
    <OtpCodeField value={code} onChange={(value) => { setCode(value); setErrorKey(null); }} disabled={loading} error={errorKey} />
    {errorKey ? <InlineNotice tone="error">{t(errorKey)}</InlineNotice> : null}
    <View style={styles.resendWrap}>{cooldown > 0 ? <Text style={[styles.resendMuted, { color: theme.mutedText }]}>{t('onboarding_otp_resend_in', { seconds: cooldown })}</Text> : <TouchableOpacity accessibilityRole="button" accessibilityState={{ busy: resending }} disabled={resending} onPress={() => void resend()} style={styles.textAction}>{resending ? <ActivityIndicator color={theme.brand} /> : <Text style={[styles.actionText, { color: theme.brandText }]}>{t('onboarding_otp_resend')}</Text>}</TouchableOpacity>}</View>
    <Text style={[styles.deliveryHint, { color: theme.mutedText }]}>{t('onboarding_v2_code_delay')}</Text>
  </OnboardingScaffold>;
}

const styles = StyleSheet.create({
  emailRow: { alignItems: 'center', gap: 4 }, email: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 15, writingDirection: 'ltr' },
  textAction: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }, actionText: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 14 },
  cells: { flexDirection: 'row', gap: 7, justifyContent: 'center' }, cell: { flex: 1, maxWidth: 52, minWidth: 38, height: 58, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, digit: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 24, fontVariant: ['tabular-nums'] },
  logicalInput: { position: 'absolute', width: 1, height: 1, opacity: 0 }, resendWrap: { alignItems: 'center' }, resendMuted: { ...Typography.getTextVariantStyle('body'), fontSize: 14, fontVariant: ['tabular-nums'] }, deliveryHint: { ...Typography.getTextVariantStyle('body'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
