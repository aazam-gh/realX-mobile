import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth, signInWithCustomToken } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InlineNotice, OnboardingPrimaryButton, OnboardingScaffold } from '../../components/onboarding/OnboardingUI';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { logger } from '../../utils/logger';
import { getOnboardingErrorKey, normalizeCallableCode } from '../../utils/onboarding';
import { trackOnboardingEvent } from '../../utils/onboardingAnalytics';
import { clearPendingVerification } from '../../utils/verificationPending';

export default function PendingVerificationScreen() {
  const router = useRouter();
  const { email, role, statusToken } = useLocalSearchParams<{ email?: string; role?: string; statusToken?: string }>();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { continueAsGuest } = useAuthAccess();
  const { isOnline } = useConnectivity();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const approvalTrackedRef = useRef(false);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []));

  const checkStatus = useCallback(async () => {
    if (!email || !statusToken || status !== 'pending') return;
    if (!isOnline) {
      setErrorKey('onboarding_error_network');
      return;
    }

    setChecking(true);
    setErrorKey(null);
    try {
      const checkFn = httpsCallable(getFunctions(undefined, 'me-central1'), 'checkVerificationStatus');
      const result = await checkFn({ email, statusToken });
      const data = result.data as { status: string; rejectionReason?: string };
      setLastChecked(new Date());

      if (data.status === 'approved') {
        setStatus('approved');
        if (!approvalTrackedRef.current) {
          approvalTrackedRef.current = true;
          void trackOnboardingEvent('approval_view', { source: 'status_check' });
        }
      } else if (data.status === 'rejected') {
        setStatus('rejected');
        setRejectionReason(data.rejectionReason || null);
        await clearPendingVerification();
      } else if (data.status === 'expired') {
        setStatus('rejected');
        setRejectionReason(t('onboarding_pending_expired'));
        await clearPendingVerification();
      } else if (data.status === 'cancelled') {
        await clearPendingVerification();
        router.replace('/(onboarding)' as any);
      }
    } catch (error) {
      logger.error('Status check error:', error);
      if (normalizeCallableCode(error) === 'permission-denied') {
        await clearPendingVerification();
        router.replace({ pathname: '/(onboarding)/email', params: { mode: 'login', prefillEmail: email, role } } as any);
        return;
      }
      const nextErrorKey = getOnboardingErrorKey(error);
      setErrorKey(nextErrorKey);
    } finally {
      setChecking(false);
    }
  }, [email, isOnline, role, router, status, statusToken, t]);

  useEffect(() => {
    void checkStatus();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') void checkStatus();
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [checkStatus]);

  const handleTryAgain = () => {
    const expired = rejectionReason === t('onboarding_pending_expired');
    router.replace({ pathname: expired ? '/(onboarding)/verification-intro' : '/(onboarding)/upload-id', params: { email, role: role || 'student' } } as any);
  };

  const handleFinishAccount = async () => {
    if (!email || !isOnline || signingIn) {
      if (!isOnline) setErrorKey('onboarding_error_network');
      return;
    }

    setSigningIn(true);
    setErrorKey(null);
    void trackOnboardingEvent('approved_login_tap', { source: 'approval' });
    try {
      const sendOtp = httpsCallable(getFunctions(undefined, 'me-central1'), 'sendOtp');
      const result = await sendOtp({ email, purpose: 'login' });
      void trackOnboardingEvent('otp_sent', { purpose: 'login', source: 'approval' });
      const customToken = (result.data as { customToken?: string }).customToken;
      if (customToken) {
        await signInWithCustomToken(getAuth(), customToken);
        await clearPendingVerification();
        void trackOnboardingEvent('auth_success', { purpose: 'login', source: 'approval' });
        return;
      }
      router.replace({ pathname: '/(onboarding)/verify', params: { email, purpose: 'login', role } } as any);
    } catch (error) {
      logger.error('Unable to send approved-account login code', error);
      setErrorKey(getOnboardingErrorKey(error));
    } finally {
      setSigningIn(false);
    }
  };

  const title = status === 'pending'
    ? t('onboarding_pending_title')
    : status === 'approved'
      ? t('onboarding_pending_approved_title')
      : t('onboarding_pending_rejected_title');

  const footer = status === 'pending'
    ? <OnboardingPrimaryButton label={t('onboarding_pending_check_status')} loadingLabel={t('onboarding_v2_checking_email')} loading={checking} onPress={() => void checkStatus()} />
    : status === 'approved'
      ? <OnboardingPrimaryButton label={t('onboarding_pending_login_now')} loading={signingIn} disabled={!email} onPress={() => void handleFinishAccount()} />
      : <OnboardingPrimaryButton label={t('onboarding_pending_try_again')} onPress={handleTryAgain} />;

  return (
    <OnboardingScaffold title={title} progress={{ current: 5, total: 5 }} footer={footer}>
      {status === 'pending' ? (
        <>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>{t('onboarding_pending_email_notification')}</Text>
          {email ? <View style={[styles.emailBadge, { backgroundColor: theme.cardMuted }]}><Ionicons name="mail-outline" size={20} color={theme.iconMuted} /><Text selectable style={[styles.emailText, { color: theme.text }]} numberOfLines={1}>{email}</Text></View> : null}
          <View style={[styles.reviewNotice, { backgroundColor: theme.brandSoft }]}><Ionicons name="time-outline" size={20} color={theme.brand} /><Text style={[styles.reviewNoticeText, { color: theme.text }]}>{t('onboarding_pending_description')}</Text></View>
          {lastChecked ? <Text style={[styles.lastCheckedText, { color: theme.subtleText }]}>{t('onboarding_pending_last_checked', { time: lastChecked.toLocaleTimeString() })}</Text> : null}
          {errorKey ? <InlineNotice tone="error">{t(errorKey)}</InlineNotice> : null}
          <TouchableOpacity accessibilityRole="button" onPress={() => void continueAsGuest()} style={styles.guestButton}><Text style={[styles.guestButtonText, { color: theme.brandText }]}>{t('onboarding_pending_browse_guest')}</Text></TouchableOpacity>
        </>
      ) : status === 'approved' ? (
        <>
          <View style={[styles.statusIcon, { backgroundColor: theme.brandSoft }]}><Ionicons name="checkmark-circle" size={42} color={theme.brand} /></View>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>{t('onboarding_pending_approved_message')}</Text>
          {errorKey ? <InlineNotice tone="error">{t(errorKey)}</InlineNotice> : null}
        </>
      ) : (
        <>
          <View style={styles.rejectedIcon}><Ionicons name="close-circle" size={42} color="#D92D20" /></View>
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>{rejectionReason ? t('onboarding_pending_rejection_reason', { reason: rejectionReason }) : t('onboarding_pending_rejected_default')}</Text>
        </>
      )}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...Typography.getTextVariantStyle('body'), fontSize: 16, lineHeight: 24 },
  emailBadge: { minHeight: 56, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailText: { flex: 1, ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 15, writingDirection: 'ltr' },
  reviewNotice: { borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  reviewNoticeText: { flex: 1, ...Typography.getTextVariantStyle('body'), fontSize: 14, lineHeight: 20 },
  lastCheckedText: { ...Typography.getTextVariantStyle('body'), fontSize: 13, fontVariant: ['tabular-nums'] },
  guestButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  guestButtonText: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 16, textDecorationLine: 'underline' },
  statusIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  rejectedIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE4E2' },
});
