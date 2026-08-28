import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOnboardingEvent } from './onboardingAnalytics';

test('normalizes allowlisted onboarding events without accepting PII fields', () => {
  assert.deepEqual(normalizeOnboardingEvent({
    eventName: 'email_submit',
    sessionId: 'session_12345678',
    parameters: {
      mode: 'login',
      email: 'student@example.com',
      source: 'welcome',
    },
  }), {
    eventName: 'email_submit',
    sessionId: 'session_12345678',
    parameters: { mode: 'login', source: 'welcome' },
  });
});

test('rejects unknown events and malformed session ids', () => {
  assert.equal(normalizeOnboardingEvent({ eventName: 'email_address', sessionId: 'session_12345678' }), null);
  assert.equal(normalizeOnboardingEvent({ eventName: 'welcome_view', sessionId: 'short' }), null);
});
