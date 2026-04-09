import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../../components/PhonkText';
import { useTranslation } from 'react-i18next';
import { setVerificationImages } from '../../utils/verificationStore';

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

export default function UploadIdScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const arrowIconName = isRTL ? 'arrow-forward' : 'arrow-back';

  const [frontImage, setFrontImage] = useState<{ uri: string; base64: string } | null>(null);
  const [backImage, setBackImage] = useState<{ uri: string; base64: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    if (asset.base64 && Math.ceil((asset.base64.length * 3) / 4) > MAX_SIZE_BYTES) {
      Alert.alert(t('error'), t('onboarding_upload_image_too_large'));
      return;
    }

    const imageData = {
      uri: asset.uri,
      base64: asset.base64 || '',
    };

    if (side === 'front') {
      setFrontImage(imageData);
    } else {
      setBackImage(imageData);
    }
  };

  const handleContinue = () => {
    if (!frontImage || !backImage || isLoading) return;

    setIsLoading(true);
    try {
      setVerificationImages(frontImage.base64, backImage.base64);
      router.push({
        pathname: '/(onboarding)/verify-email',
        params: { mode: 'verification' },
      } as any);
    } catch (err: any) {
      Alert.alert(t('error'), err.message || t('onboarding_generic_error_message'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const bothUploaded = frontImage && backImage;

  return (
    <View style={styles.container}>
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

      <View style={styles.cardContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.card}
        >
          <View style={styles.textContainer}>
            <PhonkText style={styles.titleLine}>
              <Text style={styles.greenText}>{t('onboarding_upload_id_title_prefix')}</Text>
            </PhonkText>
            <PhonkText style={styles.titleLine}>
              <Text style={styles.blackText}>{t('onboarding_upload_id_title_suffix')}</Text>
            </PhonkText>
          </View>

          <Text style={styles.subtitle}>{t('onboarding_upload_id_description')}</Text>

          <View style={styles.uploadContainer}>
            {/* Front upload */}
            <TouchableOpacity
              style={[styles.uploadZone, frontImage && styles.uploadZoneFilled]}
              onPress={() => pickImage('front')}
              activeOpacity={0.7}
            >
              {frontImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: frontImage.uri }} style={styles.previewImage} contentFit="contain" />
                  <View style={styles.replaceBadge}>
                    <Text style={styles.replaceText}>{t('onboarding_upload_replace')}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={36} color="#999" />
                  <Text style={styles.uploadLabel}>{t('onboarding_upload_front')}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Back upload */}
            <TouchableOpacity
              style={[styles.uploadZone, backImage && styles.uploadZoneFilled]}
              onPress={() => pickImage('back')}
              activeOpacity={0.7}
            >
              {backImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: backImage.uri }} style={styles.previewImage} contentFit="contain" />
                  <View style={styles.replaceBadge}>
                    <Text style={styles.replaceText}>{t('onboarding_upload_replace')}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={36} color="#999" />
                  <Text style={styles.uploadLabel}>{t('onboarding_upload_back')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.infoText}>{t('onboarding_upload_id_info')}</Text>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, (!bothUploaded || isLoading) && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!bothUploaded || isLoading}
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
  textContainer: { marginBottom: 16, alignItems: 'center' },
  titleLine: { fontSize: 32, textAlign: 'center', lineHeight: 38 },
  greenText: { color: Colors.brandGreen },
  blackText: { color: '#000000' },
  subtitle: {
    fontSize: 14, color: '#666', textAlign: 'center',
    lineHeight: 20, fontFamily: Typography.poppins.medium,
    marginBottom: 24, paddingHorizontal: 10,
  },
  uploadContainer: {
    flexDirection: 'row', gap: 16, marginBottom: 20,
  },
  uploadZone: {
    flex: 1, height: 180, borderRadius: 20,
    borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FAFAFA', overflow: 'hidden',
  },
  uploadZoneFilled: {
    borderWidth: 2, borderColor: Colors.brandGreen,
    borderStyle: 'solid', backgroundColor: '#F0F9F0',
  },
  uploadPlaceholder: {
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  uploadLabel: {
    fontSize: 13, color: '#999', fontFamily: Typography.poppins.medium,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
  },
  previewImage: {
    width: '100%', height: '100%', borderRadius: 18,
  },
  replaceBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: Colors.brandGreen, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  replaceText: {
    color: '#fff', fontSize: 11, fontFamily: Typography.poppins.semiBold,
  },
  infoText: {
    fontSize: 13, color: '#999', textAlign: 'center',
    lineHeight: 18, fontFamily: Typography.poppins.medium,
    paddingHorizontal: 10,
  },
  footer: { paddingBottom: 40, marginTop: 'auto' },
  button: {
    backgroundColor: Colors.brandGreen, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontFamily: Typography.poppins.medium },
});
