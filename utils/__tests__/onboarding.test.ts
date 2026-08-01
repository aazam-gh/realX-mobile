jest.mock('../analytics', () => ({ trackEvent: jest.fn() }));

import {
  decideOnboardingDestination,
  getOnboardingErrorKey,
  isValidEmail,
  normalizeCallableCode,
  normalizeEmail,
} from '../onboarding';

describe('onboarding helpers', () => {
  it('normalizes email identity consistently', () => {
    expect(normalizeEmail(' Student.Name+test@googlemail.com ')).toBe('student.name+test@googlemail.com');
    expect(normalizeEmail(' Student@School.edu.qa ')).toBe('student@school.edu.qa');
  });

  it('validates email before network submission', () => {
    expect(isValidEmail('student@school.edu.qa')).toBe(true);
    expect(isValidEmail('student@school')).toBe(false);
  });

  it('normalizes Firebase callable error codes', () => {
    expect(normalizeCallableCode({ code: 'functions/not-found' })).toBe('not-found');
    expect(normalizeCallableCode({ code: 'invalid-argument' })).toBe('invalid-argument');
  });

  it('maps namespaced callable failures to stable UI messages', () => {
    expect(getOnboardingErrorKey({ code: 'functions/not-found' })).toBe('onboarding_error_account_not_found');
    expect(getOnboardingErrorKey({ code: 'functions/unavailable' })).toBe('onboarding_error_network');
    expect(getOnboardingErrorKey({ code: 'functions/invalid-argument', message: 'Incorrect code' }))
      .toBe('onboarding_error_code_invalid');
  });

  it('resolves resumable launch destinations without route churn', () => {
    expect(decideOnboardingDestination({ authenticated: true, hasProfile: true, guest: false, pendingVerification: false })).toBe('home');
    expect(decideOnboardingDestination({ authenticated: true, hasProfile: false, guest: false, pendingVerification: true })).toBe('profile');
    expect(decideOnboardingDestination({ authenticated: false, hasProfile: false, guest: false, pendingVerification: true })).toBe('pending');
    expect(decideOnboardingDestination({ authenticated: false, hasProfile: false, guest: true, pendingVerification: true })).toBe('home');
    expect(decideOnboardingDestination({ authenticated: false, hasProfile: false, guest: false, pendingVerification: false })).toBe('welcome');
  });
});
