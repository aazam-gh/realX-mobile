import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../constants/Typography';
import { BadrgoColors } from '../../constants/BadrgoColors';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { fetchBadrgoPilotCampaign } from '../../utils/pilotCampaign';
import { queryKeys } from '../../utils/queryClient';
import ScalePressable from '../ScalePressable';

const { black: BADRGO_BLACK, red: BADRGO_RED, white: BADRGO_WHITE } = BadrgoColors;

export default function BadrgoPilotBanner() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthAccess();
  const { isRTL } = useAppLocale();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: queryKeys.pilotCampaign(isAuthenticated ? 'authenticated' : 'guest'),
    queryFn: fetchBadrgoPilotCampaign,
    retry: false,
    staleTime: 60_000,
  });

  if (!data || data.status === 'unavailable') return null;

  const hasClaim = !!data.claim;
  const soldOut = data.status === 'sold_out' && !hasClaim;

  return (
    <View style={styles.section}>
      <ScalePressable
        accessibilityRole="button"
        accessibilityLabel={hasClaim ? t('badrgo_pilot_view_code') : t('badrgo_pilot_claim_cta')}
        onPress={() => router.push('/pilot/badrgo' as any)}
        style={[styles.card, { backgroundColor: BADRGO_WHITE, borderColor: BADRGO_RED }]}
      >
        <Image
          accessibilityLabel="badrgo car"
          contentFit="contain"
          source={require('../../assets/images/badrgo-car.webp')}
          style={styles.carImage}
        />
        <View style={styles.perforation} />
        <View style={[styles.content, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.brandRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="car-sport-outline" size={16} color={BADRGO_RED} />
            <Text style={styles.brandText}>badrgo</Text>
            <Text style={[styles.voucherText, { color: BADRGO_BLACK }]}>RIDE VOUCHER</Text>
          </View>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: BADRGO_BLACK, textAlign: isRTL ? 'right' : 'left' }]}
          >
            {hasClaim ? t('badrgo_pilot_code_ready') : t('badrgo_pilot_banner_title')}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.subtitle, { color: BADRGO_BLACK, textAlign: isRTL ? 'right' : 'left' }]}
          >
            {soldOut
              ? t('badrgo_pilot_sold_out_short')
              : hasClaim
              ? t('badrgo_pilot_view_code')
              : t('badrgo_pilot_first_come')}
          </Text>
          <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.ticketStub, { borderColor: BADRGO_RED }]}>
              <Text style={styles.stubText}>{hasClaim ? 'CODE READY' : 'LIMITED'}</Text>
            </View>
            <View style={styles.claimButton}>
              <Text style={styles.claimText}>
                {hasClaim ? t('badrgo_pilot_view_code') : t('badrgo_pilot_claim_cta')}
              </Text>
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={17} color={BADRGO_WHITE} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 102,
    backgroundColor: BADRGO_WHITE,
  },
  perforation: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: BADRGO_RED,
    marginHorizontal: 18,
  },
  content: {
    padding: 16,
    gap: 7,
  },
  brandRow: {
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: BADRGO_RED,
    fontSize: 13,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  voucherText: {
    fontSize: 10,
    letterSpacing: 1.1,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  title: {
    fontSize: 20,
    lineHeight: 25,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    ...Typography.getTextVariantStyle('body'),
  },
  actionRow: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 3,
  },
  ticketStub: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubText: {
    color: BADRGO_RED,
    fontSize: 9,
    letterSpacing: 0.8,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  claimButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: BADRGO_RED,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  claimText: {
    color: BADRGO_WHITE,
    fontSize: 13,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
});
