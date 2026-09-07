import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../constants/Typography';
import { BadrgoColors } from '../constants/BadrgoColors';
import { useAppLocale } from '../context/LocaleContext';
import { fetchBadrgoPilotCampaign } from '../utils/pilotCampaign';
import { queryKeys } from '../utils/queryClient';
import ScalePressable from './ScalePressable';

const { black: BADRGO_BLACK, red: BADRGO_RED, white: BADRGO_WHITE } = BadrgoColors;

export default function BadrgoCouponHistoryCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { isRTL } = useAppLocale();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: queryKeys.pilotCampaign(userId),
    queryFn: fetchBadrgoPilotCampaign,
    enabled: !!userId,
    retry: false,
  });

  if (!data?.claim) return null;

  return (
    <ScalePressable
      accessibilityRole="button"
      accessibilityLabel={t('badrgo_pilot_view_code')}
      onPress={() => router.push('/pilot/badrgo' as any)}
      style={[styles.card, { backgroundColor: BADRGO_WHITE, borderColor: BADRGO_BLACK }]}
    >
      <View style={styles.logoTile}>
        <Image
          accessibilityLabel="badrgo"
          contentFit="contain"
          source={require('../assets/images/badrgo-logo.png')}
          style={styles.logo}
        />
      </View>
      <View style={[styles.copy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.label, { color: BADRGO_RED }]}>{t('badrgo_pilot_coupon_label')}</Text>
        <Text style={[styles.title, { color: BADRGO_BLACK }]}>{t('badrgo_pilot_code_ready')}</Text>
        <Text style={[styles.code, { color: BADRGO_BLACK }]}>{data.claim.code}</Text>
      </View>
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={22} color={BADRGO_BLACK} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoTile: {
    width: 64,
    height: 54,
    borderRadius: 14,
    backgroundColor: BADRGO_WHITE,
    padding: 7,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    fontSize: 12,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  title: {
    fontSize: 17,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  code: {
    fontSize: 13,
    letterSpacing: 1.2,
    ...Typography.getTextVariantStyle('body'),
  },
});
