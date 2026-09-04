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
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
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

const BADRGO_RED = '#CF0A2C';

export default function BadrgoPilotScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
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
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} />
        <StateSurface kind="loading" />
      </SafeAreaView>
    );
  }

  if (!previewMode && (campaignQuery.error || campaign.status === 'unavailable')) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} />
        <StateSurface
          kind={campaignQuery.error ? 'error' : 'empty'}
          title={t('badrgo_pilot_unavailable_title')}
          message={t('badrgo_pilot_unavailable_body')}
          onRetry={campaignQuery.error ? campaignQuery.refetch : undefined}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <AppHeader title={t('badrgo_pilot_screen_title')} onBackPress={() => router.back()} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: theme.card, borderColor: `${BADRGO_RED}29` }]}>
          <View style={styles.logoTile}>
            <Image
              accessibilityLabel="Badrgo"
              contentFit="contain"
              source={require('../../assets/images/badrgo-logo.png')}
              style={styles.logo}
            />
          </View>
          <Text
            selectable
            style={[styles.heroTitle, { color: theme.text, textAlign: 'center' }]}
          >
            {claim ? t('badrgo_pilot_code_ready') : title || t('badrgo_pilot_banner_title')}
          </Text>
          {!claim && description ? (
            <Text
              selectable
              style={[styles.heroBody, { color: theme.mutedText, textAlign: 'center' }]}
            >
              {description}
            </Text>
          ) : null}

          {claim ? (
            <ScalePressable
              accessibilityRole="button"
              accessibilityLabel={t('badrgo_pilot_copy_code')}
              onPress={() => void handleCopy()}
              style={[styles.codeCard, { borderColor: `${BADRGO_RED}66` }]}
            >
              <View style={styles.codeCopy}>
                <Text style={styles.codeLabel}>{t('badrgo_pilot_coupon_label')}</Text>
                <Text selectable style={styles.codeText}>{claim.code}</Text>
              </View>
              <View style={styles.copyIcon}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={22} color="#FFFFFF" />
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.claimButtonText}>
                    {campaign.status === 'sold_out'
                      ? t('badrgo_pilot_sold_out')
                      : campaign.status === 'scheduled'
                      ? t('badrgo_pilot_coming_soon')
                      : t('badrgo_pilot_claim_cta')}
                  </Text>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFFFFF" />
                </>
              )}
            </ScalePressable>
          )}

          {claimMutation.error ? (
            <Text selectable style={[styles.errorText, { color: theme.danger }]}>
              {(claimMutation.error as Error).message || t('badrgo_pilot_claim_failed')}
            </Text>
          ) : null}

          {!claim && campaign.status === 'active' ? (
            <Text style={[styles.availability, { color: theme.mutedText }]}>
              {t('badrgo_pilot_first_come')}
            </Text>
          ) : null}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: theme.cardMuted }]}>
          <DetailRow
            icon="person-outline"
            text={t('badrgo_pilot_one_per_user')}
            color={theme.text}
            isRTL={isRTL}
          />
          <DetailRow
            icon="shield-checkmark-outline"
            text={t('badrgo_pilot_secure_assignment')}
            color={theme.text}
            isRTL={isRTL}
          />
          {instructions ? (
            <DetailRow icon="information-circle-outline" text={instructions} color={theme.text} isRTL={isRTL} />
          ) : null}
        </View>

        {claim && campaign.destinationUrl ? (
          <ScalePressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(campaign.destinationUrl!)}
            style={[styles.secondaryButton, { borderColor: theme.borderStrong }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              {t('badrgo_pilot_open_badrgo')}
            </Text>
            <Ionicons name="open-outline" size={19} color={theme.icon} />
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
    boxShadow: '0 16px 42px rgba(207, 10, 44, 0.11)',
  },
  logoTile: {
    width: '100%',
    maxWidth: 260,
    height: 118,
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
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
    backgroundColor: '#FFF8F9',
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
    color: '#151515',
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
    backgroundColor: '#FFF0F3',
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
