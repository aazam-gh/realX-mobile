import Ionicons from '@expo/vector-icons/Ionicons';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingPrimaryButton, OnboardingScaffold } from '../../components/onboarding/OnboardingUI';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useConnectivity } from '../../context/ConnectivityContext';
import { logger } from '../../utils/logger';
import { getOnboardingErrorKey, trackOnboarding } from '../../utils/onboarding';
import { savePendingVerification } from '../../utils/verificationPending';

const MAX_SIZE_BYTES = 3 * 1024 * 1024;

export default function UploadIdScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { role, email } = useLocalSearchParams<{ role?: string; email?: string }>();
  const { isOnline } = useConnectivity();
  const [uploadedImage, setUploadedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'preparing' | 'uploading' | 'submitting' | null>(null);

  const pickImage = async () => {
    setErrorKey(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (asset.mimeType && !['image/jpeg', 'image/png'].includes(asset.mimeType)) {
        setErrorKey('onboarding_upload_unsupported');
      } else if (!asset.width || !asset.height || Math.min(asset.width, asset.height) < 480) {
        setErrorKey('onboarding_upload_too_small');
      } else if (!asset.base64) {
        setErrorKey('onboarding_upload_unreadable');
      } else if (Math.ceil((asset.base64.length * 3) / 4) > MAX_SIZE_BYTES) {
        setErrorKey('onboarding_upload_image_too_large');
      } else {
        setUploadedImage({ uri: asset.uri, base64: asset.base64 });
      }
    } catch (error) {
      logger.error('Unable to open image picker', error);
      setErrorKey('onboarding_upload_picker_failed');
    }
  };

  const handleContinue = async () => {
    if (!uploadedImage?.base64 || !email || isLoading) return;
    if (!isOnline) {
      setErrorKey('onboarding_error_network');
      return;
    }

    setIsLoading(true);
    setUploadPhase('preparing');
    setErrorKey(null);
    try {
      setUploadPhase('uploading');
      const submitFn = httpsCallable(getFunctions(undefined, 'me-central1'), 'submitVerificationRequest');
      void trackOnboarding('verification_upload_started', { source: 'photo_library' });
      const submission = await submitFn({ email, idImageBase64: uploadedImage.base64, role: role || 'student' });
      setUploadPhase('submitting');
      const { statusToken } = submission.data as { statusToken: string };
      await savePendingVerification(email, role || 'student', statusToken);
      void trackOnboarding('verification_submitted', { method: 'student_id', role: role || 'student' });
      router.replace({ pathname: '/(onboarding)/pending', params: { email, role: role || 'student', statusToken } });
    } catch (error) {
      logger.error('Unable to submit verification request', error);
      const nextErrorKey = getOnboardingErrorKey(error);
      setErrorKey(nextErrorKey);
      void trackOnboarding('manual_verification_failed', { error_code: nextErrorKey });
    } finally {
      setIsLoading(false);
      setUploadPhase(null);
    }
  };

  const canContinue = Boolean(uploadedImage?.base64 && email && !isLoading);
  const title = `${t('onboarding_upload_id_title_prefix')} ${t('onboarding_upload_id_title_suffix')}`;

  return (
    <OnboardingScaffold
      title={title}
      subtitle={t('onboarding_upload_id_description')}
      onBack={() => router.back()}
      onClose={() => router.replace('/(onboarding)' as any)}
      progress={{ current: 4, total: 5 }}
      footer={<OnboardingPrimaryButton label={t('onboarding_upload_continue')} loadingLabel={t(`onboarding_upload_${uploadPhase || 'preparing'}`)} loading={isLoading} disabled={!canContinue} onPress={() => void handleContinue()} />}
    >
      <TouchableOpacity
        accessibilityLabel={uploadedImage ? t('onboarding_upload_replace') : t('onboarding_upload_id_single')}
        accessibilityRole="button"
        activeOpacity={0.82}
        onPress={() => void pickImage()}
        style={[styles.uploadZone, { backgroundColor: uploadedImage ? theme.brandSoft : theme.cardMuted, borderColor: uploadedImage ? theme.brand : theme.border }]}
      >
        {uploadedImage ? (
          <>
            <Image source={{ uri: uploadedImage.uri }} style={styles.previewImage} contentFit="contain" />
            <View style={[styles.replaceBadge, { backgroundColor: theme.actionSolid }]}><Text style={[styles.replaceText, { color: theme.onActionSolid }]}>{t('onboarding_upload_replace')}</Text></View>
          </>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="images-outline" size={36} color={theme.iconMuted} />
            <Text style={[styles.uploadLabel, { color: theme.text }]}>{t('onboarding_upload_id_single')}</Text>
            <Text style={[styles.uploadInfo, { color: theme.subtleText }]}>{t('onboarding_upload_id_info')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.qualityList}>
        {['corners', 'readable', 'glare'].map((item) => (
          <View key={item} style={styles.qualityItem}>
            <Ionicons name="checkmark-circle" size={18} color={theme.brand} />
            <Text style={[styles.qualityText, { color: theme.mutedText }]}>{t(`onboarding_upload_quality_${item}`)}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.privacy, { backgroundColor: theme.cardMuted }]}>
        <Text style={[styles.privacyText, { color: theme.mutedText }]}>{t('onboarding_upload_privacy_explanation')}</Text>
        <View style={styles.privacyLinks}>
          <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/privacy' as any)}><Text style={[styles.privacyLink, { color: theme.brandText }]}>{t('privacy_policy')}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/terms' as any)}><Text style={[styles.privacyLink, { color: theme.brandText }]}>{t('terms_and_conditions')}</Text></TouchableOpacity>
        </View>
      </View>

      {errorKey ? <View><Text selectable accessibilityLiveRegion="polite" style={[styles.inlineError, { color: theme.danger }]}>{t(errorKey)}</Text>{errorKey === 'onboarding_upload_picker_failed' ? <TouchableOpacity accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.settingsButton}><Text style={[styles.privacyLink, { color: theme.brandText }]}>{t('onboarding_v2_open_settings')}</Text></TouchableOpacity> : null}</View> : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  uploadZone: { height: 230, borderWidth: 1.5, borderRadius: 20, borderStyle: 'dashed', overflow: 'hidden' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 24 },
  uploadLabel: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 16 },
  uploadInfo: { ...Typography.getTextVariantStyle('body'), fontSize: 13, textAlign: 'center' },
  previewImage: { width: '100%', height: '100%' },
  replaceBadge: { position: 'absolute', right: 12, bottom: 12, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  replaceText: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 13 },
  qualityList: { gap: 10 },
  qualityItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qualityText: { flex: 1, ...Typography.getTextVariantStyle('body'), fontSize: 14, lineHeight: 20 },
  privacy: { borderRadius: 16, padding: 16, gap: 12 },
  privacyText: { ...Typography.getTextVariantStyle('body'), fontSize: 13, lineHeight: 19 },
  privacyLinks: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  privacyLink: { ...Typography.getTextVariantStyle('bodyStrong'), fontSize: 13, textDecorationLine: 'underline' },
  inlineError: { ...Typography.getTextVariantStyle('body'), fontSize: 13, lineHeight: 19 },
  settingsButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
