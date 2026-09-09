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
  BADRGO_INVITE_URL,
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
  const { firebaseUser, isAuthenticated, requireAuth } = useAuthAccess();
  const router = useRouter();
  const params = useLocalSearchParams<{ preview?: string }>();
  const previewMode = __DEV__ && params.preview === '1';
  const [previewClaim, setPreviewClaim] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const campaignQuery = useQuery({
    queryKey: queryKeys.pilotCampaign(firebaseUser?.uid || 'guest'),
    queryFn: fetchBadrgoPilotCampaign,
    enabled: !previewMode,
    retry: false,
  });
  const campaign = useMemo<PilotCampaign>(() => {
    if (!previewMode) return campaignQuery.data || { exists: false, status: 'unavailable' };
    return {
      ...badrgoPilotPreview,
      claim: previewClaim
        ? { code: previewClaim, status: 'assigned', claimedAt: new Date().toISOString() }
        : null,
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
        queryKeys.pilotCampaign(firebaseUser?.uid || 'authenticated'),
        (current: PilotCampaign | undefined) => current
          ? {
              ...current,
              claim,
              currentClaim: claim,
              eligibility: current.eligibility
                ? { ...current.eligibility, canClaim: false, reason: 'already_claimed_this_week' }
                : undefined,
            }
          : current
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
  const fetchedClaim = campaign.currentClaim || campaign.claim;
  const claim = fetchedClaim?.status === 'redeemed' ? null : fetchedClaim;
  const isClaimable = campaign.eligibility?.canClaim ?? (campaign.status === 'active' && !claim);

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
      <SafeAreaView style={[styles.screen, { backgroundColor: BADRGO_RED }]}>
        <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} style={styles.header} titleStyle={styles.headerTitle} backButtonStyle={styles.headerButton} backIconColor={BADRGO_WHITE} />
        <StateSurface kind="loading" colors={{ primary: BADRGO_WHITE, text: BADRGO_WHITE, mutedText: BADRGO_WHITE, surface: BADRGO_RED, danger: BADRGO_WHITE, onPrimary: BADRGO_RED }} />
      </SafeAreaView>
    );
  }

  if (!previewMode && (campaignQuery.error || campaign.status === 'unavailable')) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: BADRGO_RED }]}>
        <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} style={styles.header} titleStyle={styles.headerTitle} backButtonStyle={styles.headerButton} backIconColor={BADRGO_WHITE} />
        <StateSurface
          kind={campaignQuery.error ? 'error' : 'empty'}
          title={t('badrgo_pilot_unavailable_title')}
          message={t('badrgo_pilot_unavailable_body')}
          onRetry={campaignQuery.error ? campaignQuery.refetch : undefined}
          colors={{ primary: BADRGO_WHITE, text: BADRGO_WHITE, mutedText: BADRGO_WHITE, surface: BADRGO_RED, danger: BADRGO_WHITE, onPrimary: BADRGO_RED }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: BADRGO_RED }]} edges={['top', 'bottom']}>
      <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} style={styles.header} titleStyle={styles.headerTitle} backButtonStyle={styles.headerButton} backIconColor={BADRGO_WHITE} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
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
            style={[styles.heroTitle, { textAlign: 'center' }]}
          >
            {claim ? t('badrgo_pilot_code_ready') : title || t('badrgo_pilot_banner_title')}
          </Text>
          {!claim && description ? (
            <Text
              selectable
              style={[styles.heroBody, { textAlign: 'center' }]}
            >
              {description}
            </Text>
          ) : null}

          {claim ? (
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel={t('badrgo_pilot_copy_code')}
              onPress={() => void handleCopy()}
              style={styles.codeCard}
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
                    {campaign.status === 'out_of_stock'
                      ? t('badrgo_pilot_sold_out')
                      : campaign.status === 'paused'
                      ? t('badrgo_voucher_paused')
                      : t('badrgo_pilot_claim_cta')}
                  </Text>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={BADRGO_RED} />
                </>
              )}
            </ScalePressable>
          )}

          {claimMutation.error ? (
            <Text selectable style={styles.errorText}>
              {(claimMutation.error as Error).message || t('badrgo_pilot_claim_failed')}
            </Text>
          ) : null}

          {!claim ? (
            <Text style={styles.availability}>
              {campaign.eligibility?.reason === 'previous_code_not_redeemed'
                ? t('badrgo_voucher_use_current_first')
                : campaign.eligibility?.reason === 'already_claimed_this_week'
                  ? t('badrgo_voucher_claimed_this_week')
                  : t('badrgo_pilot_first_come')}
            </Text>
          ) : null}
        </View>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="person-outline"
            text={t('badrgo_pilot_one_per_user')}
            color={BADRGO_WHITE}
            isRTL={isRTL}
          />
          <DetailRow
            icon="shield-checkmark-outline"
            text={t('badrgo_pilot_secure_assignment')}
            color={BADRGO_WHITE}
            isRTL={isRTL}
          />
          {instructions ? (
            <DetailRow icon="information-circle-outline" text={instructions} color={BADRGO_WHITE} isRTL={isRTL} />
          ) : null}
        </View>

        {campaign.recentClaims?.length ? (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>{t('badrgo_voucher_history')}</Text>
            {campaign.recentClaims.map((historyClaim) => (
              <View key={historyClaim.id || [historyClaim.periodKey, historyClaim.claimedAt].join('-')} style={styles.historyRow}>
                <Text style={styles.historyPeriod}>{historyClaim.periodKey}</Text>
                <Text style={styles.historyStatus}>
                  {historyClaim.status === 'redeemed'
                    ? t('badrgo_voucher_redeemed')
                    : t('badrgo_voucher_assigned')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {claim ? (
          <ScalePressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(campaign.destinationUrl || BADRGO_INVITE_URL)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {t('badrgo_pilot_open_badrgo')}
            </Text>
            <Ionicons name="open-outline" size={19} color={BADRGO_RED} />
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
  header: {
    backgroundColor: BADRGO_RED,
  },
  headerTitle: {
    color: BADRGO_WHITE,
  },
  headerButton: {
    backgroundColor: BADRGO_RED,
    borderColor: BADRGO_WHITE,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: BADRGO_RED,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
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
    color: BADRGO_WHITE,
    fontSize: 28,
    lineHeight: 34,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  heroBody: {
    color: BADRGO_WHITE,
    fontSize: 15,
    lineHeight: 23,
    ...Typography.getTextVariantStyle('body'),
  },
  claimButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: BADRGO_WHITE,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  claimButtonText: {
    color: BADRGO_RED,
    fontSize: 16,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  availability: {
    color: BADRGO_WHITE,
    fontSize: 12,
    textAlign: 'center',
    ...Typography.getTextVariantStyle('body'),
  },
  errorText: {
    color: BADRGO_WHITE,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    ...Typography.getTextVariantStyle('body'),
  },
  codeCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 0,
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
    backgroundColor: BADRGO_RED,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  detailRow: {
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: BADRGO_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    ...Typography.getTextVariantStyle('body'),
  },
  historySection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  historyTitle: {
    color: BADRGO_WHITE,
    fontSize: 16,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  historyRow: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyPeriod: {
    color: BADRGO_WHITE,
    fontSize: 14,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  historyStatus: {
    color: BADRGO_WHITE,
    fontSize: 13,
    ...Typography.getTextVariantStyle('body'),
  },
  secondaryButton: {
    alignSelf: 'center',
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: BADRGO_WHITE,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    color: BADRGO_RED,
    fontSize: 15,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
});
