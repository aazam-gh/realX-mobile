/// <reference types="jest" />

import { classifyFirebaseError } from '../../utils/firebaseError';

describe('classifyFirebaseError', () => {
  test.each([
    ['network-request-failed', 'offline', true],
    ['unavailable', 'unavailable', true],
    ['unauthenticated', 'auth', false],
    ['permission-denied', 'permission', false],
    ['invalid-argument', 'validation', false],
    ['resource-exhausted', 'rate_limited', true],
    ['not-found', 'not_found', false],
  ])('maps %s to a stable user-facing category', (code, kind, retryable) => {
    expect(classifyFirebaseError({ code })).toMatchObject({ kind, retryable });
  });

  test('keeps unknown failures retryable without exposing their message', () => {
    expect(classifyFirebaseError(new Error('unexpected backend detail'))).toEqual({
      kind: 'unknown',
      retryable: true,
      code: '',
    });
  });
});
