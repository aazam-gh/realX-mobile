import { trackEvent } from './analytics';

export type OnboardingErrorKey =
  | 'onboarding_error_account_exists'
  | 'onboarding_error_account_not_found'
  | 'onboarding_error_code_expired'
  | 'onboarding_error_code_invalid'
  | 'onboarding_error_code_used'
  | 'onboarding_error_email_invalid'
  | 'onboarding_error_network'
  | 'onboarding_error_rate_limited'
  | 'onboarding_error_school_email_required'
  | 'onboarding_generic_error_message';

export const normalizeEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));

export type OnboardingLaunchState = {
  authenticated: boolean;
  hasProfile: boolean;
  guest: boolean;
  pendingVerification: boolean;
};

export type OnboardingDestination = 'home' | 'profile' | 'pending' | 'welcome';

export const decideOnboardingDestination = ({ authenticated, hasProfile, guest, pendingVerification }: OnboardingLaunchState): OnboardingDestination => {
  if (authenticated) return hasProfile ? 'home' : 'profile';
  if (guest) return 'home';
  if (pendingVerification) return 'pending';
  return 'welcome';
};

export const normalizeCallableCode = (error: unknown) =>
  String((error as { code?: unknown })?.code || '')
    .toLowerCase()
    .replace(/^functions\//, '');

export const getOnboardingErrorKey = (error: unknown): OnboardingErrorKey => {
  const code = normalizeCallableCode(error);
  const message = String((error as { message?: unknown })?.message || '').toLowerCase();

  if (code === 'not-found') return 'onboarding_error_account_not_found';
  if (code === 'already-exists') return 'onboarding_error_account_exists';
  if (code === 'deadline-exceeded') return 'onboarding_error_code_expired';
  if (code === 'resource-exhausted') return 'onboarding_error_rate_limited';
  if (code === 'unavailable' || code === 'network-request-failed' || message.includes('network')) {
    return 'onboarding_error_network';
  }
  if (code === 'invalid-argument' && message.includes('code')) return 'onboarding_error_code_invalid';
  if (code === 'permission-denied' && message.includes('used')) return 'onboarding_error_code_used';
  if (code === 'permission-denied' && message.includes('school')) return 'onboarding_error_school_email_required';
  if (code === 'invalid-argument' && message.includes('email')) return 'onboarding_error_email_invalid';

  return 'onboarding_generic_error_message';
};

type FunnelValue = string | number | boolean | undefined;

export const trackOnboarding = (
  action: string,
  parameters: Record<string, FunnelValue> = {},
) => {
  const payload = { flow_version: 'onboarding_v2', ...parameters };
  void trackEvent('onboarding_funnel', { action, ...payload });
  return trackEvent(action, payload);
};
