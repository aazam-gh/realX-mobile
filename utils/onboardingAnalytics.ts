import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import { logger } from './logger';

export type OnboardingEventName =
  | 'welcome_view'
  | 'login_tap'
  | 'create_account_tap'
  | 'guest_tap'
  | 'role_selected'
  | 'email_submit'
  | 'otp_sent'
  | 'otp_verified'
  | 'auth_success'
  | 'approval_view'
  | 'approved_login_tap';

type OnboardingEventParameters = Partial<Record<'mode' | 'purpose' | 'role' | 'source', string>>;

const SESSION_STORAGE_KEY = 'onboarding_analytics_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
let cachedSessionId: string | null = null;

const createSessionId = () => `onboarding_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;

const getSessionId = async () => {
  if (cachedSessionId) return cachedSessionId;

  try {
    const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { id?: string; createdAt?: number };
      if (parsed.id && parsed.createdAt && Date.now() - parsed.createdAt < SESSION_MAX_AGE_MS) {
        cachedSessionId = parsed.id;
        return parsed.id;
      }
    }
  } catch (error) {
    logger.debug('Unable to restore onboarding analytics session', error);
  }

  cachedSessionId = createSessionId();
  try {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      id: cachedSessionId,
      createdAt: Date.now(),
    }));
  } catch (error) {
    logger.debug('Unable to persist onboarding analytics session', error);
  }
  return cachedSessionId;
};

export const trackOnboardingEvent = async (
  eventName: OnboardingEventName,
  parameters: OnboardingEventParameters = {},
) => {
  try {
    const sessionId = await getSessionId();
    const recordEvent = httpsCallable(getFunctions(undefined, 'me-central1'), 'recordOnboardingEvent');
    await recordEvent({ eventName, sessionId, parameters });
  } catch (error) {
    // Analytics must never interrupt authentication.
    logger.debug('Unable to record onboarding event', { eventName, error });
  }
};
