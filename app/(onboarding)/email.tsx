import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getAuth, signInWithCustomToken } from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InlineNotice, OnboardingField, OnboardingPrimaryButton, OnboardingScaffold, OnboardingSecondaryButton } from '../../components/onboarding/OnboardingUI';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { logger } from '../../utils/logger';
import { clearPendingVerificationForEmail } from '../../utils/verificationPending';
import { getOnboardingErrorKey, isValidEmail, normalizeCallableCode, normalizeEmail, trackOnboarding } from '../../utils/onboarding';

type AuthMode = 'signup' | 'login';
type RouteResolution = 'existing_account' | 'no_account' | 'student_id' | null;

export default function EmailOnboarding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: AuthMode; prefillEmail?: string; role?: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { isOnline } = useConnectivity();
  const inputRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<AuthMode>(params.mode === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState(params.prefillEmail || '');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [resolution, setResolution] = useState<RouteResolution>(null);

  useEffect(() => { void trackOnboarding('email_viewed', { auth_mode: mode, flow_version: 'onboarding_v2' }); }, [mode]);

  const sendCode = async (purpose: 'signup' | 'login' | 'verification') => {
    const normalizedEmail = normalizeEmail(email);
    setLoading(true);
    setErrorKey(null);
    try {
      const functions = getFunctions(undefined, 'me-central1');
      const sendOtp = httpsCallable(functions, 'sendOtp');
      const response = await sendOtp({ email: normalizedEmail, purpose });
      const immediateToken = (response.data as { customToken?: string }).customToken;
      if (immediateToken) {
        await signInWithCustomToken(getAuth(), immediateToken);
        await clearPendingVerificationForEmail(normalizedEmail);
        void trackOnboarding('auth_code_verified', { auth_mode: 'login', verification_method: 'review_bypass' });
        return;
      }
      void trackOnboarding('auth_code_sent', { auth_mode: mode, verification_method: purpose === 'verification' ? 'student_id' : 'school_email' });
      router.replace({
        pathname: '/(onboarding)/verify',
        params: {
          email: normalizedEmail,
          purpose,
          ...(params.role ? { role: params.role } : purpose !== 'login' ? { role: 'student' } : {}),
        },
      });
    } catch (error) {
      logger.error('Unable to send onboarding code', error);
      const code = normalizeCallableCode(error);
      if (mode === 'signup' && (code === 'permission-denied' || getOnboardingErrorKey(error) === 'onboarding_error_school_email_required')) {
        setResolution('student_id');
        void trackOnboarding('auth_route_resolved', { auth_mode: mode, next_route: 'student_id', verification_method: 'student_id' });
      } else if (mode === 'login' && code === 'not-found') {
        setResolution('no_account');
        void trackOnboarding('auth_route_resolved', { auth_mode: mode, next_route: 'signup' });
      } else if (mode === 'signup' && code === 'already-exists') {
        setResolution('existing_account');
        void trackOnboarding('auth_route_resolved', { auth_mode: mode, next_route: 'login' });
      } else {
        const next = getOnboardingErrorKey(error);
        setErrorKey(next);
        void trackOnboarding('auth_error_shown', { step: 'email', error_code: next, recoverable: true });
      }
    } finally { setLoading(false); }
  };

  const submit = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) { setErrorKey('onboarding_error_email_invalid'); inputRef.current?.focus(); return; }
    if (!isOnline) { setErrorKey('onboarding_error_network'); return; }
    setResolution(null);
    void trackOnboarding('auth_email_submitted', { auth_mode: mode });

    if (mode === 'login') { await sendCode('login'); return; }
    setLoading(true);
    try {
      const functions = getFunctions(undefined, 'me-central1');
      const checkStudent = httpsCallable(functions, 'checkStudentExists');
      const result = await checkStudent({ email: normalizedEmail });
      if ((result.data as { exists?: boolean }).exists) {
        setResolution('existing_account');
        void trackOnboarding('auth_route_resolved', { auth_mode: mode, next_route: 'login' });
        return;
      }
    } catch (error) {
      const code = normalizeCallableCode(error);
      if (code !== 'permission-denied') {
        const next = getOnboardingErrorKey(error);
        setErrorKey(next);
        void trackOnboarding('auth_error_shown', { step: 'email', error_code: next, recoverable: true });
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    await sendCode('signup');
  };

  const handleStudentId = () => {
    const normalizedEmail = normalizeEmail(email);
    void trackOnboarding('auth_email_submitted', { auth_mode: mode, verification_method: 'student_id' });
    router.push({
      pathname: '/(onboarding)/verification-intro',
      params: {
        role: params.role || 'student',
        ...(isValidEmail(normalizedEmail) ? { email: normalizedEmail } : {}),
      },
    });
  };

  const switchMode = (next: AuthMode) => { setMode(next); setResolution(null); setErrorKey(null); };
  const notice = resolution === 'student_id'
    ? <InlineNotice tone="info" actionLabel={t('onboarding_v2_verify_student_id')} onAction={handleStudentId}>{t('onboarding_v2_student_id_fallback')}</InlineNotice>
    : resolution === 'existing_account'
      ? <InlineNotice tone="success" actionLabel={t('onboarding_v2_send_signin_code')} onAction={() => { switchMode('login'); void sendCode('login'); }}>{t('onboarding_v2_existing_account')}</InlineNotice>
      : resolution === 'no_account'
        ? <InlineNotice tone="info" actionLabel={t('onboarding_v2_create_account')} onAction={() => switchMode('signup')}>{t('onboarding_v2_no_account')}</InlineNotice>
        : null;

  return <OnboardingScaffold
    title={mode === 'login' ? t('onboarding_v2_login_title') : t('onboarding_v2_email_title')}
    subtitle={mode === 'login' ? t('onboarding_v2_login_subtitle') : undefined}
    onBack={() => router.back()}
    onClose={() => router.replace('/(onboarding)' as any)}
    progress={mode === 'signup' ? { current: 2, total: 4 } : undefined}
    footer={<OnboardingPrimaryButton label={mode === 'login' ? t('onboarding_v2_send_signin_code') : t('onboarding_email_continue')} loadingLabel={t('onboarding_v2_checking_email')} loading={loading} disabled={!isValidEmail(email)} onPress={() => void submit()} />}
  >
    <OnboardingField
      inputRef={inputRef}
      label={mode === 'login' ? t('onboarding_login_email_placeholder') : t('onboarding_email_placeholder')}
      error={errorKey ? t(errorKey) : null}
      value={email}
      onChangeText={(value) => { setEmail(value); setErrorKey(null); setResolution(null); }}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      returnKeyType="done"
      editable={!loading}
      onSubmitEditing={() => void submit()}
      style={{ writingDirection: 'ltr', textAlign: 'left' }}
    />
    {mode === 'signup' ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      <Text style={{ color: theme.mutedText, ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 13, letterSpacing: 1.2 }}>{t('onboarding_or')}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
    </View> : null}
    {mode === 'signup' ? <OnboardingSecondaryButton label={t('onboarding_v2_verify_student_id')} disabled={loading} onPress={handleStudentId} /> : null}
    {notice}
    {mode === 'signup' ? <Text style={{ color: theme.mutedText, ...Typography.getTextVariantStyle('body'), fontSize: 13, lineHeight: 19 }}>{t('onboarding_v2_legal')}</Text> : null}
    {mode === 'signup' ? <OnboardingSecondaryButton label={t('onboarding_login_action')} onPress={() => switchMode('login')} /> : null}
  </OnboardingScaffold>;
}
