import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { StateSurface } from '../../components/StateSurface';
import AppHeader, { HeaderIconButton } from '../../components/navigation/AppHeader';
import { Typography } from '../../constants/Typography';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { fetchOpportunity } from '../../utils/firebaseQueries';
import { getOpportunityAction, toDate } from '../../utils/opportunities';
import { queryKeys } from '../../utils/queryClient';
import { trackEvent } from '../../utils/analytics';

export default function OpportunityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, isRTL } = useAppLocale();
  const { isDark, theme } = useAppTheme();
  const { isGuest, requireAuth } = useAuthAccess();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const {
    data: opportunity,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.opportunity(id || ''),
    queryFn: () => fetchOpportunity(id || ''),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user || !id) return;
    const savedRef = doc(getFirestore(), 'students', user.uid, 'savedItems', `opportunity_${id}`);
    void getDoc(savedRef).then((snapshot) => setSaved(snapshot.exists()));
  }, [id]);

  useEffect(() => {
    if (!opportunity) return;
    void trackEvent('opportunity_viewed', {
      opportunity_id: opportunity.id,
      opportunity_kind: opportunity.kind,
    });
  }, [opportunity]);

  const action = useMutation({
    mutationFn: async () => {
      if (!opportunity) return;
      const result = await getOpportunityAction(opportunity.id);
      await trackEvent('opportunity_action_opened', {
        opportunity_id: opportunity.id,
        opportunity_kind: opportunity.kind,
        tracked: result.tracked,
      });
      await Linking.openURL(result.actionUrl);
    },
    onError: () => Alert.alert(t('error'), t('opportunity_action_failed')),
  });

  const toggleSave = async () => {
    if (isGuest && !requireAuth('guest_opportunity_save_message')) return;
    const user = getAuth().currentUser;
    if (!user || !opportunity) return;
    const savedRef = doc(
      getFirestore(),
      'students',
      user.uid,
      'savedItems',
      `opportunity_${opportunity.id}`,
    );
    if (saved) {
      await deleteDoc(savedRef);
      setSaved(false);
      void trackEvent('opportunity_unsaved', {
        opportunity_id: opportunity.id,
        opportunity_kind: opportunity.kind,
      });
    } else {
      await setDoc(savedRef, {
        type: 'opportunity',
        opportunityId: opportunity.id,
        kind: opportunity.kind,
        titleEn: opportunity.titleEn,
        titleAr: opportunity.titleAr || '',
        providerName: opportunity.providerName || '',
        imageUrl: opportunity.imageUrl || '',
        deadline: opportunity.deadline || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      void trackEvent('opportunity_saved', {
        opportunity_id: opportunity.id,
        opportunity_kind: opportunity.kind,
      });
    }
    void queryClient.invalidateQueries({ queryKey: ['savedOpportunities', user.uid] });
  };

  if (isLoading) {
    return <StateSurface kind="loading" />;
  }
  if (error || !opportunity) {
    return <StateSurface kind="error" onRetry={() => void refetch()} />;
  }

  const title = locale === 'ar'
    ? opportunity.titleAr || opportunity.titleEn
    : opportunity.titleEn;
  const description = locale === 'ar'
    ? opportunity.descriptionAr || opportunity.summaryAr || opportunity.descriptionEn || opportunity.summaryEn
    : opportunity.descriptionEn || opportunity.summaryEn || opportunity.descriptionAr || opportunity.summaryAr;
  const location = locale === 'ar'
    ? opportunity.locationAr || opportunity.locationEn
    : opportunity.locationEn || opportunity.locationAr;
  const deadline = toDate(opportunity.deadline);
  const startsAt = toDate(opportunity.startsAt);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        animated
      />
      <AppHeader
        title={t(`opportunity_kind_${opportunity.kind}`)}
        onBackPress={() => router.back()}
        trailing={(
          <HeaderIconButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            accessibilityLabel={saved ? t('saved') : t('save')}
            selected={saved}
            onPress={() => void toggleSave()}
          />
        )}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {opportunity.imageUrl ? (
          <Image
            source={{ uri: opportunity.imageUrl }}
            style={styles.hero}
            contentFit="cover"
            transition={180}
          />
        ) : null}
        <View style={styles.body}>
          <View style={[styles.kindPill, { backgroundColor: theme.brandSoft }]}>
            <Text style={[styles.kindText, { color: theme.brandText }]}>
              {t(`opportunity_kind_${opportunity.kind}`)}
            </Text>
          </View>
          <Text
            selectable
            style={[
              styles.title,
              { color: theme.text, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {title}
          </Text>
          <Text
            selectable
            style={[
              styles.provider,
              { color: theme.mutedText, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {opportunity.providerName || t('realx')}
          </Text>
          <View style={styles.metaList}>
            {startsAt ? (
              <MetaRow
                icon="calendar-outline"
                text={startsAt.toLocaleDateString(locale === 'ar' ? 'ar-QA' : 'en-QA', {
                  dateStyle: 'medium',
                })}
              />
            ) : null}
            {deadline ? (
              <MetaRow
                icon="hourglass-outline"
                text={t('apply_by_date', {
                  date: deadline.toLocaleDateString(locale === 'ar' ? 'ar-QA' : 'en-QA', {
                    dateStyle: 'medium',
                  }),
                })}
              />
            ) : null}
            {location ? <MetaRow icon="location-outline" text={location} /> : null}
          </View>
          {description ? (
            <Text
              selectable
              style={[
                styles.description,
                { color: theme.text, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {description}
            </Text>
          ) : null}
          <Pressable
            onPress={() => {
              if (isGuest && !requireAuth('guest_opportunity_action_message')) return;
              action.mutate();
            }}
            disabled={action.isPending}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: theme.actionSolid,
                opacity: action.isPending || pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.onActionSolid }]}>
              {action.isPending ? t('opening') : t('view_opportunity')}
            </Text>
            <Ionicons name="open-outline" size={18} color={theme.onActionSolid} />
          </Pressable>
          <Text style={[styles.handoff, { color: theme.subtleText }]}>
            {t('external_handoff_notice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function MetaRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
    return (
      <View style={[styles.metaRow, isRTL && styles.rowReverse]}>
        <Ionicons name={icon} size={19} color={theme.brandText} />
        <Text selectable style={[styles.metaText, { color: theme.mutedText }]}>
          {text}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  content: { paddingBottom: 44 },
  hero: {
    width: '100%',
    aspectRatio: 1.65,
  },
  body: {
    padding: 20,
    gap: 14,
  },
  kindPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  kindText: {
    fontSize: 11,
    textTransform: 'uppercase',
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  provider: {
    fontSize: 15,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  metaList: { gap: 10, paddingVertical: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { flex: 1, fontSize: 14, ...Typography.getTextVariantStyle('body') },
  description: {
    fontSize: 16,
    lineHeight: 25,
    ...Typography.getTextVariantStyle('body'),
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryButtonText: {
    fontSize: 15,
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  handoff: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    ...Typography.getTextVariantStyle('body'),
  },
});
