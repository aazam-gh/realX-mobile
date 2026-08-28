export const ONBOARDING_EVENT_NAMES = [
  'welcome_view',
  'login_tap',
  'create_account_tap',
  'guest_tap',
  'role_selected',
  'email_submit',
  'otp_sent',
  'otp_verified',
  'auth_success',
  'approval_view',
  'approved_login_tap',
] as const;

export type OnboardingEventName = typeof ONBOARDING_EVENT_NAMES[number];

const ONBOARDING_EVENT_SET = new Set<string>(ONBOARDING_EVENT_NAMES);
const ALLOWED_PARAMETER_KEYS = new Set(['mode', 'purpose', 'role', 'source']);

export type NormalizedOnboardingEvent = {
  eventName: OnboardingEventName;
  sessionId: string;
  parameters: Record<string, string>;
};

export const normalizeOnboardingEvent = (value: unknown): NormalizedOnboardingEvent | null => {
  if (!value || typeof value !== 'object') return null;

  const data = value as Record<string, unknown>;
  const eventName = typeof data.eventName === 'string' ? data.eventName : '';
  const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';

  if (!ONBOARDING_EVENT_SET.has(eventName) || !/^[a-zA-Z0-9_-]{8,100}$/.test(sessionId)) {
    return null;
  }

  const rawParameters = data.parameters;
  const parameters: Record<string, string> = {};
  if (rawParameters && typeof rawParameters === 'object' && !Array.isArray(rawParameters)) {
    for (const [key, parameter] of Object.entries(rawParameters)) {
      if (!ALLOWED_PARAMETER_KEYS.has(key) || typeof parameter !== 'string') continue;
      const normalized = parameter.trim().slice(0, 40);
      if (normalized) parameters[key] = normalized;
    }
  }

  return {
    eventName: eventName as OnboardingEventName,
    sessionId,
    parameters,
  };
};
