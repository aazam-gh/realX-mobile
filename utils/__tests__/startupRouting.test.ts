import {
  getStartupInitialRootRoute,
  isStartupRouteReady,
  resolveStartupDestination,
} from '../startupRouting';

const baseInput = {
  hasUser: false,
  hasProfile: null,
  isGuest: false,
  hasPendingVerification: false,
  missingProfileValidated: false,
  segments: ['(onboarding)'],
} as const;

describe('startup routing', () => {
  test('sends an authenticated profile past onboarding to Home', () => {
    const destination = resolveStartupDestination({
      ...baseInput,
      hasUser: true,
      hasProfile: true,
    });

    expect(destination).toBe('home');
    expect(getStartupInitialRootRoute(destination!)).toBe('(tabs)');
    expect(isStartupRouteReady(destination!, ['(tabs)'])).toBe(true);
  });

  test('sends a guest opening the app to Home', () => {
    expect(resolveStartupDestination({
      ...baseInput,
      isGuest: true,
    })).toBe('home');
  });

  test('keeps signed-out users in onboarding', () => {
    expect(resolveStartupDestination(baseInput)).toBe('onboarding');
  });

  test('routes a pending verification request to pending', () => {
    const destination = resolveStartupDestination({
      ...baseInput,
      hasPendingVerification: true,
    });

    expect(destination).toBe('pending-verification');
    expect(isStartupRouteReady(destination!, ['(onboarding)', 'pending'])).toBe(true);
  });

  test('waits for missing-profile validation before profile completion', () => {
    expect(resolveStartupDestination({
      ...baseInput,
      hasUser: true,
      hasProfile: false,
    })).toBeNull();

    expect(resolveStartupDestination({
      ...baseInput,
      hasUser: true,
      hasProfile: false,
      missingProfileValidated: true,
    })).toBe('profile-completion');
  });

  test('preserves authenticated deep links and non-Home tabs', () => {
    expect(resolveStartupDestination({
      ...baseInput,
      hasUser: true,
      hasProfile: true,
      segments: ['vendor', 'vendor-1'],
    })).toBe('deep-link');

    expect(resolveStartupDestination({
      ...baseInput,
      hasUser: true,
      hasProfile: true,
      segments: ['(tabs)', 'profile'],
    })).toBe('deep-link');
  });
});
