export type StartupDestination =
  | 'home'
  | 'onboarding'
  | 'pending-verification'
  | 'profile-completion'
  | 'deep-link';

export type StartupRouteInput = {
  hasUser: boolean;
  hasProfile: boolean | null;
  isGuest: boolean;
  hasPendingVerification: boolean;
  missingProfileValidated: boolean;
  segments: readonly string[];
};

const GUEST_ALLOWED_ROOT_SEGMENTS = new Set([
  '(tabs)',
  'category',
  'search',
  'vendor',
  'opportunity',
  'terms',
  'privacy',
  'x-academy',
  'wakti',
]);

const SIGNED_OUT_PUBLIC_ROOT_SEGMENTS = new Set(['terms', 'privacy']);

export function resolveStartupDestination({
  hasUser,
  hasProfile,
  isGuest,
  hasPendingVerification,
  missingProfileValidated,
  segments,
}: StartupRouteInput): StartupDestination | null {
  const rootSegment = String(segments[0] || '');
  const tabSegment = String(segments[1] || '');
  const inOnboarding = segments.includes('(onboarding)');

  if (!hasUser) {
    if (isGuest) {
      if (
        (rootSegment === '(tabs)' && (!tabSegment || tabSegment === 'index'))
        || inOnboarding
        || !GUEST_ALLOWED_ROOT_SEGMENTS.has(rootSegment)
      ) {
        return 'home';
      }
      return 'deep-link';
    }

    if (hasPendingVerification) return 'pending-verification';
    if (SIGNED_OUT_PUBLIC_ROOT_SEGMENTS.has(rootSegment)) return 'deep-link';
    return 'onboarding';
  }

  if (hasProfile === true) {
    if (
      (rootSegment === '(tabs)' && (!tabSegment || tabSegment === 'index'))
      || inOnboarding
      || !rootSegment
    ) return 'home';
    return 'deep-link';
  }

  if (hasProfile === false && missingProfileValidated) return 'profile-completion';
  return null;
}

export function isStartupRouteReady(
  destination: StartupDestination,
  segments: readonly string[],
) {
  const rootSegment = String(segments[0] || '');
  const currentPath = segments.join('/');

  switch (destination) {
    case 'home':
      return rootSegment === '(tabs)';
    case 'onboarding':
      return segments.includes('(onboarding)');
    case 'pending-verification':
      return currentPath.includes('pending');
    case 'profile-completion':
      return currentPath.includes('details');
    case 'deep-link':
      return true;
  }
}

export function getStartupInitialRootRoute(destination: StartupDestination) {
  return destination === 'home' || destination === 'deep-link' ? '(tabs)' : '(onboarding)';
}
