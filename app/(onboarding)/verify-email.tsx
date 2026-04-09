import { Ionicons } from '@expo/vector-icons';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { useTranslation } from 'react-i18next';

const normalizeEmail = (email: string): string => {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  if (!domain) return trimmed;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const cleanLocal = local.split('+')[0].replace(/\./g, '');
    return `${cleanLocal}@gmail.com`;
  }
  return trimmed;
};

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const arrowIconName = isRTL ? 'arrow-forward' : 'arrow-back';
  const inputTextAlign: 'left' | 'right' = isRTL ? 'right' : 'left';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;

    setIsLoading(true);
    try {
      const fnInstance = getFunctions(undefined, 'me-central1');
      const sendOtp = httpsCallable(fnInstance, 'sendOtp');
      await sendOtp({ email: normalizedEmail, purpose: 'verification' });

      router.replace({
        pathname: '/(onboarding)/verify',
        params: { email: normalizedEmail, purpose: 'verification' },
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert(t('error'), err.message || t('onboarding_generic_error_message'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar style="light" />

      <View style={styles.headerBackground}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={[styles.topButtons, isRTL && styles.topButtonsRTL]}>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <Ionicons name={arrowIconName} size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View style={[styles.cardContainer, { flex: 1 }]}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.card}>
            <View style={styles.textContainer}>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.greenText}>{t('onboarding_verify_email_title_prefix')}</Text>
              </PhonkText>
              <PhonkText style={styles.titleLine}>
                <Text style={styles.blackText}>{t('onboarding_verify_email_title_suffix')}</Text>
              </PhonkText>
            </View>

            <View style={styles.inputWrapper}>
              <View style={[styles.singleInputContainer, { marginBottom: 15 }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { textAlign: inputTextAlign }]}
                  placeholder={t('onboarding_email_placeholder')}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  autoFocus
                />
              </View>
            </View>

            <Text style={styles.infoText}>{t('onboarding_verify_email_description')}</Text>
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, (isLoading || !email) && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={isLoading || !email}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('onboarding_continue')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  textContainer: { marginBottom: 40, alignItems: 'center' },
  titleLine: { fontSize: 32, textAlign: 'center', lineHeight: 38 },
  greenText: { color: Colors.brandGreen },
  blackText: { color: '#000000' },
  inputWrapper: { marginBottom: 20 },
  singleInputContainer: {
    backgroundColor: '#F3F3F3', borderRadius: 30,
    height: 60, justifyContent: 'center', paddingHorizontal: 25,
  },
  input: { fontSize: 16, fontFamily: Typography.poppins.medium, color: '#000' },
  infoText: {
    fontSize: 14, color: '#999', textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 10,
    fontFamily: Typography.poppins.medium, margin: 8,
  },
  footer: { paddingBottom: 40, marginTop: 'auto' },
  button: {
    backgroundColor: Colors.brandGreen, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontFamily: Typography.poppins.medium },
});
