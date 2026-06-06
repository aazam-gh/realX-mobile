// Auth utility helpers
// Magic link helpers have been removed — OTP auth is now used instead.

const INVALID_SESSION_AUTH_CODES = [
  'auth/invalid-user-token',
  'auth/user-disabled',
  'auth/user-not-found',
  'auth/user-token-expired',
];

export const isInvalidAuthSessionError = (error: unknown) => {
  const code = String((error as { code?: unknown } | null)?.code || '').toLowerCase();
  return INVALID_SESSION_AUTH_CODES.some((invalidCode) => code.includes(invalidCode));
};
