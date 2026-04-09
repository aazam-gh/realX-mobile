import { Ionicons } from '@expo/vector-icons';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { useTranslation } from 'react-i18next';

export default function PendingVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { email } = params;
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const [status, setStatus] = useState<'loading' | 'pending' | 'approved' | 'rejected'>('loading');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!email) return;
    setIsChecking(true);
    try {
      const fnInstance = getFunctions(undefined, 'me-central1');
      const checkFn = httpsCallable(fnInstance, 'checkVerificationStatus');
      const result = await checkFn({ email });
      const data = result.data as { status: string; rejectionReason?: string | null };

      if (data.status === 'approved') {
        setStatus('approved');
        handleApproved();
      } else if (data.status === 'rejected') {
        setStatus('rejected');
        setRejectionReason(data.rejectionReason || null);
      } else if (data.status === 'pending') {
        setStatus('pending');
      } else {
        setStatus('pending');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('pending');
    } finally {
      setIsChecking(false);
    }
  }, [email]);

  // Check on mount and poll every 30s
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleApproved = async () => {
    if (!email) return;
    setIsLoggingIn(true);
    try {
      // Send login OTP — the admin already created the auth user
      const fnInstance = getFunctions(undefined, 'me-central1');
      const sendOtp = httpsCallable(fnInstance, 'sendOtp');
      await sendOtp({ email, purpose: 'login' });

      router.replace({
        pathname: '/(onboarding)/verify',
        params: { email, purpose: 'login' },
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('error'), err.message || t('onboarding_generic_error_message'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTryAgain = () => {
    router.replace('/(onboarding)/upload-id' as any);
  };

  const handleBack = () => {
    router.replace('/' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={[styles.topButtons, isRTL && styles.topButtonsRTL]}>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {status === 'loading' || isChecking ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.brandGreen} />
            </View>
          ) : status === 'approved' || isLoggingIn ? (
            <View style={styles.centerContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark-circle" size={72} color={Colors.brandGreen} />
              </View>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.greenText}>{t('onboarding_pending_approved_title')}</Text>
              </PhonkText>
              <Text style={styles.subtitle}>{t('onboarding_pending_approved_message')}</Text>
              <ActivityIndicator size="large" color={Colors.brandGreen} style={{ marginTop: 24 }} />
            </View>
          ) : status === 'rejected' ? (
            <View style={styles.centerContent}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF0F0' }]}>
                <Ionicons name="close-circle" size={72} color="#E53935" />
              </View>
              <PhonkText style={styles.titleLine}>
                <Text style={{ color: '#E53935' }}>{t('onboarding_pending_rejected_title')}</Text>
              </PhonkText>
              {rejectionReason ? (
                <Text style={[styles.subtitle, { color: '#E53935' }]}>
                  {t('onboarding_pending_rejection_reason', { reason: rejectionReason })}
                </Text>
              ) : (
                <Text style={styles.subtitle}>{t('onboarding_pending_rejected_default')}</Text>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handleTryAgain}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{t('onboarding_pending_try_again')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.centerContent}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={72} color={Colors.brandGreen} />
              </View>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.greenText}>{t('onboarding_pending_title')}</Text>
              </PhonkText>
              <Text style={styles.subtitle}>{t('onboarding_pending_description')}</Text>

              {email && (
                <View style={styles.emailBadge}>
                  <Text style={styles.emailText}>{email}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.checkButton, isChecking && styles.buttonDisabled]}
                onPress={checkStatus}
                disabled={isChecking}
                activeOpacity={0.8}
              >
                {isChecking ? (
                  <ActivityIndicator color={Colors.brandGreen} />
                ) : (
                  <Text style={styles.checkButtonText}>{t('onboarding_pending_check_status')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brandGreen },
  headerBackground: { height: 250, backgroundColor: Colors.brandGreen },
  headerContent: { paddingHorizontal: 20, paddingTop: 10 },
  topButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  topButtonsRTL: { flexDirection: 'row-reverse' },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardContainer: {
    flex: 1, backgroundColor: 'white',
    borderTopLeftRadius: 50, borderTopRightRadius: 50,
    marginTop: -80, paddingHorizontal: 30, paddingTop: 40,
  },
  card: { flex: 1 },
  centerContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#F0F9F0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 32,
  },
  titleLine: { fontSize: 28, textAlign: 'center', lineHeight: 34, marginBottom: 16 },
  greenText: { color: Colors.brandGreen },
  subtitle: {
    fontSize: 16, color: '#666', textAlign: 'center',
    lineHeight: 24, fontFamily: Typography.poppins.medium,
    marginBottom: 24, paddingHorizontal: 10,
  },
  emailBadge: {
    backgroundColor: '#F3F3F3', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 12,
    marginBottom: 32,
  },
  emailText: {
    fontSize: 16, fontFamily: Typography.poppins.medium,
    color: '#333',
  },
  checkButton: {
    borderWidth: 2, borderColor: Colors.brandGreen, borderRadius: 28,
    height: 56, justifyContent: 'center', alignItems: 'center',
    width: '100%', maxWidth: 300,
  },
  checkButtonText: {
    color: Colors.brandGreen, fontSize: 16,
    fontFamily: Typography.poppins.semiBold,
  },
  button: {
    backgroundColor: Colors.brandGreen, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    width: '100%', maxWidth: 300, marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontFamily: Typography.poppins.medium },
});
