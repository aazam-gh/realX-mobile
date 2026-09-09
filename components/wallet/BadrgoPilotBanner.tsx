import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../constants/Typography';
import { BadrgoColors } from '../../constants/BadrgoColors';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { badrgoPilotPreview, fetchBadrgoPilotCampaign } from '../../utils/pilotCampaign';
import { queryKeys } from '../../utils/queryClient';

const { red: BADRGO_RED, white: BADRGO_WHITE } = BadrgoColors;

export default function BadrgoPilotBanner({ showPreviewWhenUnavailable = false }: { showPreviewWhenUnavailable?: boolean }) {
  const { t } = useTranslation();
  const { firebaseUser } = useAuthAccess();
  const { isRTL } = useAppLocale();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: queryKeys.pilotCampaign(firebaseUser?.uid || 'guest'),
    queryFn: fetchBadrgoPilotCampaign,
    retry: false,
    staleTime: 60_000,
  });

  const campaign = data && data.status !== 'unavailable'
    ? data
    : showPreviewWhenUnavailable
      ? badrgoPilotPreview
      : null;

  if (!campaign) return null;

  const currentClaim = campaign.currentClaim || campaign.claim;
  const hasClaim = !!currentClaim && currentClaim.status !== 'redeemed';

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasClaim ? t('badrgo_pilot_view_code') : t('badrgo_pilot_claim_cta')}
        onPress={() => router.push('/pilot/badrgo' as any)}
        style={[styles.banner, { backgroundColor: BADRGO_WHITE }]}
      >
        <Image
          accessibilityLabel="badrgo car"
          contentFit="contain"
          source={require('../../assets/images/badrgo-car.webp')}
          style={styles.carImage}
        />
        <View
          style={[
            styles.content,
            { alignItems: isRTL ? 'flex-end' : 'flex-start', backgroundColor: BADRGO_RED },
          ]}
        >
          <View style={[styles.brandRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="car-sport-outline" size={16} color={BADRGO_WHITE} />
            <Text style={styles.brandText}>badrgo</Text>
            <Text style={styles.voucherText}>RIDE VOUCHER</Text>
          </View>
          <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text numberOfLines={2} style={styles.title}>
              {t('badrgo_pilot_code_ready')}
            </Text>
            <Ionicons
              name={isRTL ? 'arrow-back' : 'arrow-forward'}
              size={18}
              color={BADRGO_WHITE}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingBottom: 22,
  },
  banner: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 116,
    backgroundColor: BADRGO_WHITE,
  },
  content: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 5,
  },
  brandRow: {
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: BADRGO_WHITE,
    fontSize: 13,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  voucherText: {
    color: BADRGO_WHITE,
    fontSize: 10,
    letterSpacing: 1.1,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  titleRow: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: BADRGO_WHITE,
    fontSize: 17,
    lineHeight: 22,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
});
