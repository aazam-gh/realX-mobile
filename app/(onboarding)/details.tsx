import { getAuth } from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InlineNotice, OnboardingField, OnboardingPrimaryButton, OnboardingScaffold } from '../../components/onboarding/OnboardingUI';
import { useConnectivity } from '../../context/ConnectivityContext';
import { clearLocalAuthSession, isInvalidAuthSessionError } from '../../utils/auth';
import { getOnboardingErrorKey } from '../../utils/onboarding';
import { logger } from '../../utils/logger';

export default function DetailsOnboarding() {
  const router = useRouter();
  const { email, role: initialRole } = useLocalSearchParams<{ email?: string; role?: string }>();
  const { t } = useTranslation();
  const { isOnline } = useConnectivity();
  const lastNameRef = useRef<TextInput>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const role = initialRole === 'creator' ? 'creator' : 'student';
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || loading) return;
    if (!isOnline) { setErrorKey('onboarding_error_network'); return; }
    const user = getAuth().currentUser;
    if (!user) { setErrorKey('onboarding_generic_error_message'); return; }
    setLoading(true); setErrorKey(null);
    try {
      const completeSignup = httpsCallable(getFunctions(undefined, 'me-central1'), 'completeSignup');
      await completeSignup({ firstName: firstName.trim(), lastName: lastName.trim(), email: email || user.email, role });
      router.replace('/(tabs)' as any);
    } catch (error) {
      logger.error('Unable to create account profile', error);
      try {
        const snapshot = await getDoc(doc(getFirestore(), 'students', user.uid));
        if (snapshot.exists()) {
          router.replace('/(tabs)' as any);
          return;
        }
      } catch (readError) { logger.warn('Unable to confirm profile after signup response loss', readError); }
      if (isInvalidAuthSessionError(error) || String((error as { code?: unknown })?.code || '').includes('unauthenticated')) {
        await clearLocalAuthSession().catch(() => undefined);
        router.replace('/(onboarding)' as any);
        return;
      }
      const next = getOnboardingErrorKey(error);
      setErrorKey(next);
    } finally { setLoading(false); }
  };

  const exit = async () => { await clearLocalAuthSession().catch(() => undefined); router.replace('/(onboarding)' as any); };

  return <OnboardingScaffold title={t('onboarding_v2_profile_title')} subtitle={t('onboarding_v2_profile_subtitle')} onClose={() => void exit()} progress={{ current: 4, total: 4 }} footer={<OnboardingPrimaryButton label={t('onboarding_v2_create_account')} loadingLabel={t('onboarding_v2_creating_account')} loading={loading} disabled={!firstName.trim() || !lastName.trim()} onPress={() => void submit()} />}>
    <OnboardingField label={t('first_name_placeholder')} value={firstName} onChangeText={(value) => { setFirstName(value); setErrorKey(null); }} autoComplete="given-name" textContentType="givenName" returnKeyType="next" onSubmitEditing={() => lastNameRef.current?.focus()} editable={!loading} />
    <OnboardingField inputRef={lastNameRef} label={t('last_name_placeholder')} value={lastName} onChangeText={(value) => { setLastName(value); setErrorKey(null); }} autoComplete="family-name" textContentType="familyName" returnKeyType="done" onSubmitEditing={() => void submit()} editable={!loading} />
    {errorKey ? <InlineNotice tone="error">{t(errorKey)}</InlineNotice> : null}
  </OnboardingScaffold>;
}
