import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../../components/navigation/AppHeader';
import ScalePressable from '../../components/ScalePressable';
import { StateSurface } from '../../components/StateSurface';
import { BadrgoColors } from '../../constants/BadrgoColors';
import { Typography } from '../../constants/Typography';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { triggerSubtleHaptic } from '../../utils/haptics';
import {
  badrgoPilotPreview,
  claimBadrgoPilotCoupon,
  fetchBadrgoPilotCampaign,
  PilotCampaign,
} from '../../utils/pilotCampaign';
import { queryClient, queryKeys } from '../../utils/queryClient';

const { black: BADRGO_BLACK, red: BADRGO_RED, white: BADRGO_WHITE } = BadrgoColors;

export default function BadrgoPilotScreen() {
  const { t } = useTranslation();
  const { locale, isRTL } = useAppLocale();
  const isArabic = locale === 'ar';
  const { isAuthenticated, requireAuth } = useAuthAccess();
  const router = useRouter();
  const params = useLocalSearchParams<{ preview?: string }>();
  const previewMode = __DEV__ && params.preview === '1';
  const [previewClaim, setPreviewClaim] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const campaignQuery = useQuery({
    queryKey: queryKeys.pilotCampaign(isAuthenticated ? 'authenticated' : 'guest'),
    queryFn: fetchBadrgoPilotCampaign,
    enabled: !previewMode,
    retry: false,
  });
  const campaign = useMemo<PilotCampaign>(() => {
    if (!previewMode) return campaignQuery.data || { exists: false, status: 'unavailable' };
    return {
      ...badrgoPilotPreview,
      claim: previewClaim ? { code: previewClaim, pool: 'public', claimedAt: new Date().toISOString() } : null,
    };
  }, [campaignQuery.data, previewClaim, previewMode]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (previewMode) {
        return { code: 'SAMPLECODE', pool: 'public' as const, claimedAt: new Date().toISOString() };
      }
      return claimBadrgoPilotCoupon();
    },
    onSuccess: (claim) => {
      triggerSubtleHaptic();
      if (previewMode) {
        setPreviewClaim(claim.code);
        return;
      }
      queryClient.setQueryData(
        queryKeys.pilotCampaign('authenticated'),
        (current: PilotCampaign | undefined) => current ? { ...current, claim } : current
      );
      void campaignQuery.refetch();
    },
  });

  const title = isArabic ? campaign.titleAr || campaign.title : campaign.title;
  const description = isArabic
    ? campaign.descriptionAr || campaign.description
    : campaign.description;
  const instructions = isArabic
    ? campaign.instructionsAr || campaign.instructions
    : campaign.instructions;
  const claim = campaign.claim;
  const isClaimable = campaign.status === 'active' && !claim;

  const handleClaim = () => {
    if (!isAuthenticated && !previewMode) {
      requireAuth('guest_redeem_message');
      return;
    }
    claimMutation.mutate();
  };

  const handleCopy = async () => {
    if (!claim?.code) return;
    await Clipboard.setStringAsync(claim.code);
    triggerSubtleHaptic();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!previewMode && campaignQuery.isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: BADRGO_WHITE }]}>
        <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} titleStyle={{ color: BADRGO_BLACK }} backButtonStyle={{ backgroundColor: BADRGO_WHITE, borderColor: BADRGO_BLACK }} backIconColor={BADRGO_BLACK} />
        <StateSurface kind="loading" colors={{ primary: BADRGO_RED, text: BADRGO_BLACK, mutedText: BADRGO_BLACK, surface: BADRGO_WHITE, danger: BADRGO_RED, onPrimary: BADRGO_WHITE }} />
      </SafeAreaView>
    );
  }

  if (!previewMode && (campaignQuery.error || campaign.status === 'unavailable')) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: BADRGO_WHITE }]}>
        <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} titleStyle={{ color: BADRGO_BLACK }} backButtonStyle={{ backgroundColor: BADRGO_WHITE, borderColor: BADRGO_BLACK }} backIconColor={BADRGO_BLACK} />
        <StateSurface
          kind={campaignQuery.error ? 'error' : 'empty'}
          title={t('badrgo_pilot_unavailable_title')}
          message={t('badrgo_pilot_unavailable_body')}
          onRetry={campaignQuery.error ? campaignQuery.refetch : undefined}
          colors={{ primary: BADRGO_RED, text: BADRGO_BLACK, mutedText: BADRGO_BLACK, surface: BADRGO_WHITE, danger: BADRGO_RED, onPrimary: BADRGO_WHITE }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: BADRGO_WHITE }]} edges={['top', 'bottom']}>
      <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} titleStyle={{ color: BADRGO_BLACK }} backButtonStyle={{ backgroundColor: BADRGO_WHITE, borderColor: BADRGO_BLACK }} backIconColor={BADRGO_BLACK} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: BADRGO_WHITE, borderColor: BADRGO_RED }]}>
          <View style={styles.logoTile}>
            <Image
              accessibilityLabel="badrgo"
              contentFit="contain"
              source={require('../../assets/images/badrgo-logo.png')}
              style={styles.logo}
            />
          </View>
          <Text
            selectable
            style={[styles.heroTitle, { color: BADRGO_BLACK, textAlign: 'center' }]}
          >
            {claim ? t('badrgo_pilot_code_ready') : title || t('badrgo_pilot_banner_title')}
          </Text>
          {!claim && description ? (
            <Text
              selectable
              style={[styles.heroBody, { color: BADRGO_BLACK, textAlign: 'center' }]}
            >
              {description}
            </Text>
          ) : null}

          {claim ? (
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel={t('badrgo_pilot_copy_code')}
              onPress={() => void handleCopy()}
              style={[styles.codeCard, { borderColor: BADRGO_RED }]}
            >
              <View style={styles.codeCopy}>
                <Text style={styles.codeLabel}>{t('badrgo_pilot_coupon_label')}</Text>
                <Text selectable style={styles.codeText}>{claim.code}</Text>
              </View>
              <View style={styles.copyIcon}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={22} color={BADRGO_WHITE} />
              </View>
            </ScalePressable>
          ) : (
            <ScalePressable
              accessibilityRole="button"
              disabled={!isClaimable || claimMutation.isPending}
              onPress={handleClaim}
              style={styles.claimButton}
            >
              {claimMutation.isPending ? (
                <ActivityIndicator color={BADRGO_WHITE} />
              ) : (
                <>
                  <Text style={styles.claimButtonText}>
                    {campaign.status === 'sold_out'
                      ? t('badrgo_pilot_sold_out')
                      : campaign.status === 'scheduled'
                      ? t('badrgo_pilot_coming_soon')
                      : t('badrgo_pilot_claim_cta')}
                  </Text>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={BADRGO_WHITE} />
                </>
              )}
            </ScalePressable>
          )}

          {claimMutation.error ? (
            <Text selectable style={[styles.errorText, { color: BADRGO_RED }]}>
              {(claimMutation.error as Error).message || t('badrgo_pilot_claim_failed')}
            </Text>
          ) : null}

          {!claim && campaign.status === 'active' ? (
            <Text style={[styles.availability, { color: BADRGO_BLACK }]}>
              {t('badrgo_pilot_first_come')}
            </Text>
          ) : null}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: BADRGO_WHITE, borderColor: BADRGO_BLACK }]}>
          <DetailRow
            icon="person-outline"
            text={t('badrgo_pilot_one_per_user')}
            color={BADRGO_BLACK}
            isRTL={isRTL}
          />
          <DetailRow
            icon="shield-checkmark-outline"
            text={t('badrgo_pilot_secure_assignment')}
            color={BADRGO_BLACK}
            isRTL={isRTL}
          />
          {instructions ? (
            <DetailRow icon="information-circle-outline" text={instructions} color={BADRGO_BLACK} isRTL={isRTL} />
          ) : null}
        </View>

        {claim && campaign.destinationUrl ? (
          <ScalePressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(campaign.destinationUrl!)}
            style={[styles.secondaryButton, { borderColor: BADRGO_BLACK }]}
          >
            <Text style={[styles.secondaryButtonText, { color: BADRGO_BLACK }]}>
              {t('badrgo_pilot_open_badrgo')}
            </Text>
            <Ionicons name="open-outline" size={19} color={BADRGO_BLACK} />
          </ScalePressable>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  text,
  color,
  isRTL,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={19} color={BADRGO_RED} />
      </View>
      <Text selectable style={[styles.detailText, { color, textAlign: isRTL ? 'right' : 'left' }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  logoTile: {
    width: '100%',
    maxWidth: 260,
    height: 118,
    backgroundColor: BADRGO_WHITE,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 23,
    ...Typography.getTextVariantStyle('body'),
  },
  claimButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: BADRGO_RED,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  claimButtonText: {
    color: BADRGO_WHITE,
    fontSize: 16,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  availability: {
    fontSize: 12,
    textAlign: 'center',
    ...Typography.getTextVariantStyle('body'),
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    ...Typography.getTextVariantStyle('body'),
  },
  codeCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: BADRGO_WHITE,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeCopy: {
    flex: 1,
    gap: 3,
  },
  codeLabel: {
    color: BADRGO_RED,
    fontSize: 12,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  codeText: {
    color: BADRGO_BLACK,
    fontSize: 23,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  copyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: BADRGO_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  detailRow: {
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: BADRGO_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    ...Typography.getTextVariantStyle('body'),
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    fontSize: 15,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
});
