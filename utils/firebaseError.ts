export type AppErrorKind =
  | 'auth'
  | 'permission'
  | 'validation'
  | 'rate_limited'
  | 'unavailable'
  | 'not_found'
  | 'offline'
  | 'unknown';

export type AppError = {
  kind: AppErrorKind;
  retryable: boolean;
  code: string;
};

export function classifyFirebaseError(error: unknown): AppError {
  const code = String((error as { code?: unknown } | null)?.code || '').toLowerCase();

  if (code.includes('network') || code.includes('offline') || code.includes('unavailable')) {
    return { kind: code.includes('unavailable') ? 'unavailable' : 'offline', retryable: true, code };
  }
  if (code.includes('unauthenticated') || code.includes('requires-recent-login') || code.includes('user-disabled')) {
    return { kind: 'auth', retryable: false, code };
  }
  if (code.includes('permission-denied')) return { kind: 'permission', retryable: false, code };
  if (code.includes('not-found')) return { kind: 'not_found', retryable: false, code };
  if (code.includes('resource-exhausted') || code.includes('deadline-exceeded')) {
    return { kind: 'rate_limited', retryable: true, code };
  }
  if (code.includes('invalid-argument') || code.includes('failed-precondition') || code.includes('already-exists')) {
    return { kind: 'validation', retryable: false, code };
  }
  return { kind: 'unknown', retryable: true, code };
}
