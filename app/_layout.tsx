import 'react-native-reanimated';
import { ensureFirebaseAppCheck } from '../utils/firebaseAppCheck';
import {
  getAuth,
  getIdToken,
  onAuthStateChanged,
  type FirebaseAuthTypes
} from '@react-native-firebase/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { StudentProvider, useStudent } from '../context/StudentContext';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import AppUpdatePrompt from '../components/AppUpdatePrompt';
import { LocaleProvider } from '../context/LocaleContext';
import { initI18n } from '../src/localization/i18n';
import { migrateLegacyGlobalRTL } from '../src/localization/legacyRtlMigration';
import {
  setupNotificationChannels,
} from '../utils/notifications';
import { syncExpoPushTokenForUser } from '../utils/pushNotifications';
import {
  getPendingVerification,
  clearPendingVerification,
  type PendingVerificationData,
} from '../utils/verificationPending';
import { logger } from '../utils/logger';
import { AppThemeProvider, useAppTheme } from '../context/AppThemeContext';
import { AuthAccessProvider, useAuthAccess } from '../context/AuthAccessContext';
import { ConnectivityProvider, useConnectivity } from '../context/ConnectivityContext';
import { queryClient } from '../utils/queryClient';
import { clearLocalAuthSession, isInvalidAuthSessionError } from '../utils/auth';
import { trackEvent } from '../utils/analytics';
import { trackOnboarding } from '../utils/onboarding';

import CustomSplash from './splash';
import { StateSurface } from '../components/StateSurface';



SplashScreen.setOptions({
  duration: 200,
  fade: true,
});
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Hanson: require('../assets/fonts/Hanson-Bold.otf'),
    Poppins: require('../assets/fonts/poppins.ttf'),
    JaliArabicRegular: require('../assets/fonts/jali-arabic-regular.ttf'),
    JaliArabicBold: require('../assets/fonts/jali-arabic-bold.ttf'),
    TajawalBlack: require('../assets/fonts/Tajawal-Black.ttf'),
  });

  const [i18nReady, setI18nReady] = useState(false);
  const [appCheckReady, setAppCheckReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const setupAppCheck = async () => {
      try {
        await ensureFirebaseAppCheck();
      } finally {
        if (!cancelled) {
          setAppCheckReady(true);
        }
      }
    };

    void setupAppCheck();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const setupLocalization = async () => {
      let reloading = false;

      try {
        reloading = await migrateLegacyGlobalRTL();
        if (reloading) return;
        await initI18n();
      } catch (err) {
        logger.error('Error initializing localization:', err);
      } finally {
        if (!reloading) {
          setI18nReady(true);
        }
      }
    };

    void setupLocalization();
  }, []);

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return subscriber;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AppThemeProvider>
            <ConnectivityProvider>
              <AuthAccessProvider>
                <StudentProvider>
                  <LayoutContent
                  user={user}
                  loaded={loaded}
                  error={error}
                  i18nReady={i18nReady}
                  appCheckReady={appCheckReady}
                  initializing={initializing}
                  showSplash={showSplash}
                  onSplashFinish={() => setShowSplash(false)}
                  />
                </StudentProvider>
              </AuthAccessProvider>
            </ConnectivityProvider>
          </AppThemeProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function LayoutContent({
  user,
  loaded,
  error,
  i18nReady,
  appCheckReady,
  initializing,
  showSplash,
  onSplashFinish,
}: {
  user: FirebaseAuthTypes.User | null;
  loaded: boolean;
  error: Error | null;
  i18nReady: boolean;
  appCheckReady: boolean;
  initializing: boolean;
  showSplash: boolean;
  onSplashFinish: () => void;
}) {
  const { docExists: hasProfile, error: profileError, refreshProfile } = useStudent();
  const { isGuest, loading: guestLoading } = useAuthAccess();
  const { isDark, theme } = useAppTheme();
  const { isOnline } = useConnectivity();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const [appReady, setAppReady] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerificationData | null>(null);
  const [pendingCheckDone, setPendingCheckDone] = useState(false);
  const [validatedMissingProfileUid, setValidatedMissingProfileUid] = useState<string | null>(null);
  const [startupTimedOut, setStartupTimedOut] = useState(false);
  const [startupRouteResolved, setStartupRouteResolved] = useState(false);
  const startupStartedAt = useRef<number | null>(null);
  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: theme.brand,
        background: theme.background,
        card: theme.surfaceElevated,
        text: theme.text,
        border: theme.border,
        notification: theme.brand,
      },
    };
  }, [isDark, theme]);

  useEffect(() => {
    if (startupStartedAt.current === null) startupStartedAt.current = Date.now();
    getPendingVerification().then((data) => {
      setPendingVerification(data);
      setPendingCheckDone(true);
    });
  }, []);

  useEffect(() => {
    if (
      i18nReady &&
      appCheckReady &&
      (loaded || error) &&
      !initializing &&
      !guestLoading &&
      (user === null || hasProfile !== null || profileError !== null) &&
      pendingCheckDone
    ) {
      setAppReady(true);
    }
  }, [i18nReady, appCheckReady, loaded, error, initializing, guestLoading, user, hasProfile, profileError, pendingCheckDone]);

  useEffect(() => {
    if (appReady) { setStartupTimedOut(false); return; }
    const timer = setTimeout(() => setStartupTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [appReady]);

  useEffect(() => {
    if (!appReady) return;
    const destination = isGuest ? 'home_guest' : pendingVerification ? 'verification_pending' : user && hasProfile ? 'home_authenticated' : user ? 'profile' : 'welcome';
    const startupDuration = Date.now() - (startupStartedAt.current ?? Date.now());
    void trackOnboarding('onboarding_route_resolved', {
      destination,
      duration_bucket: startupDuration < 2000 ? 'under_2s' : startupDuration < 8000 ? '2_to_8s' : 'over_8s',
      online: isOnline,
    });
    void trackEvent('app_opened', {
      access_mode: isGuest ? 'guest' : user ? 'student' : 'signed_out',
    });
  }, [appReady, hasProfile, isGuest, isOnline, pendingVerification, user]);

  // Set up local notification channels when user is authenticated with a profile
  useEffect(() => {
    if (user && hasProfile === true) {
      setupNotificationChannels();
    }
  }, [user, hasProfile]);

  useEffect(() => {
    if (!user || hasProfile !== true) return;

    let cancelled = false;

    const registerToken = async () => {
      try {
        if (cancelled) return;
        await getIdToken(user);
        if (cancelled) return;
        await syncExpoPushTokenForUser(user.uid);
      } catch (error) {
        logger.error('Error registering push token:', error);
      }
    };

    void registerToken();

    return () => {
      cancelled = true;
    };
  }, [user, hasProfile]);

  useEffect(() => {
    if (!user || hasProfile !== false) {
      setValidatedMissingProfileUid(null);
      return;
    }

    let cancelled = false;

    const validateMissingProfileSession = async () => {
      try {
        await getIdToken(user, true);
        if (!cancelled) {
          setValidatedMissingProfileUid(user.uid);
        }
      } catch (error) {
        if (cancelled) return;

        if (isInvalidAuthSessionError(error)) {
          logger.log('Signing out invalid Firebase Auth session after profile deletion', {
            uid: user.uid,
          });
          await clearLocalAuthSession().catch((signOutError) => {
            logger.error('Unable to clear invalid Firebase Auth session:', signOutError);
          });
          return;
        }

        logger.error('Unable to validate authenticated user with missing profile:', error);
      }
    };

    void validateMissingProfileSession();

    return () => {
      cancelled = true;
    };
  }, [user, hasProfile]);

  useEffect(() => {
    if (initializing || guestLoading || !loaded || !i18nReady || !pendingCheckDone) return;
    if (user && hasProfile === null && !profileError) return;

    const inAuthGroup = (segments as string[]).indexOf('(onboarding)') !== -1;
    const currentPath = segments.join('/');
    const guestAllowedRootSegments = new Set([
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
    const isGuestAllowedRoute = guestAllowedRootSegments.has(String(segments[0] || ''));
    const isSignedOutPublicRoute = ['terms', 'privacy'].includes(String(segments[0] || ''));

    if (!user) {
      if (isGuest) {
        if (inAuthGroup || !isGuestAllowedRoute) {
          router.replace('/(tabs)' as any);
        }
      } else if (pendingVerification) {
        // Has a pending verification request — show pending screen
        if (!currentPath.includes('pending')) {
          router.replace({
            pathname: '/(onboarding)/pending',
            params: {
              email: pendingVerification.email,
              role: pendingVerification.role,
              statusToken: pendingVerification.statusToken,
            },
          } as any);
        }
      } else if (!inAuthGroup && !isSignedOutPublicRoute) {
        router.replace('/(onboarding)' as any);
      }
    } else {
      if (hasProfile === true) {
        if (inAuthGroup) {
          router.replace('/(tabs)' as any);
        }
      } else if (hasProfile === false && validatedMissingProfileUid === user.uid) {
        const currentPath = segments.join('/');
        if (!currentPath.includes('details')) {
          // Fetch role from verification request for users who came through ID verification
          const fetchRoleAndNavigate = async () => {
            let role: string | undefined;
            try {
              if (user.email && pendingVerification?.statusToken) {
                const fnInstance = getFunctions(undefined, 'me-central1');
                const checkStatus = httpsCallable(fnInstance, 'checkVerificationStatus');
                const result = await checkStatus({
                  email: user.email,
                  statusToken: pendingVerification.statusToken,
                });
                const data = result.data as { status: string; role?: string };
                if (data.status !== 'none') {
                  role = data.role;
                }
              }
            } catch {
              // Fall through with no role — details.tsx defaults to 'student'
            }
            router.replace({
              pathname: '/(onboarding)/details',
              params: role ? { role } : undefined,
            } as any);
          };
          fetchRoleAndNavigate();
        }
      }
    }
  }, [user, initializing, guestLoading, isGuest, loaded, i18nReady, pendingCheckDone, segments, hasProfile, profileError, pendingVerification, router, validatedMissingProfileUid]);

  // Keep the startup splash visible until the navigator has committed the route
  // chosen from the resolved auth/profile state. Without this gate, Expo Router
  // mounts its first root screen (onboarding) before the redirect to the tabs.
  useEffect(() => {
    if (startupRouteResolved || !appReady || profileError) return;

    const rootSegment = String(segments[0] || '');
    const currentPath = segments.join('/');
    const inAuthGroup = (segments as string[]).includes('(onboarding)');
    const isSignedOutPublicRoute = ['terms', 'privacy'].includes(rootSegment);
    const isGuestAllowedRoute = new Set([
      '(tabs)',
      'category',
      'search',
      'vendor',
      'opportunity',
      'terms',
      'privacy',
      'x-academy',
      'wakti',
    ]).has(rootSegment);

    const routeIsReady = !user
      ? isGuest
        ? isGuestAllowedRoute && !inAuthGroup
        : pendingVerification
          ? currentPath.includes('pending')
          : inAuthGroup || isSignedOutPublicRoute
      : hasProfile === true
        ? !inAuthGroup
        : hasProfile === false && validatedMissingProfileUid === user.uid
          ? currentPath.includes('details')
          : false;

    if (routeIsReady) {
      setStartupRouteResolved(true);
    }
  }, [appReady, hasProfile, isGuest, pendingVerification, profileError, segments, startupRouteResolved, user, validatedMissingProfileUid]);

  // Clear pending verification once user authenticates
  useEffect(() => {
    if (
      user?.email &&
      pendingVerification?.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    ) {
      void clearPendingVerification();
      setPendingVerification(null);
    }
  }, [user, pendingVerification]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { path?: unknown } | undefined;
      const path = data?.path;

      if (typeof path === 'string' && path.startsWith('/')) {
        router.push(path as any);
      }
    });

    return () => subscription.remove();
  }, [router]);

  if ((!appReady && startupTimedOut) || (showSplash && startupTimedOut)) {
    return <ThemeProvider value={navigationTheme}><View style={[startupStyles.screen, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.brand} />
      <Text style={[startupStyles.title, { color: theme.text }]}>{t('onboarding_v2_startup_title')}</Text>
      <Text style={[startupStyles.body, { color: theme.mutedText }]}>{t('onboarding_v2_startup_body')}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => void Updates.reloadAsync()} style={[startupStyles.button, { backgroundColor: theme.actionSolid }]}><Text style={[startupStyles.buttonText, { color: theme.onActionSolid }]}>{t('retry')}</Text></TouchableOpacity>
    </View></ThemeProvider>;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={{ flex: 1 }}>
        {appReady && !profileError ? (
          <>
            <Stack>
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="category" options={{ headerShown: false }} />
              <Stack.Screen name="search" options={{ headerShown: false }} />
              <Stack.Screen name="vendor/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="opportunity/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="redeem/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="redemption-history" options={{ headerShown: false }} />
              <Stack.Screen name="saved-offers" options={{ headerShown: false }} />
              <Stack.Screen name="profile-details" options={{ headerShown: false }} />
              <Stack.Screen name="terms" options={{ headerShown: false }} />
              <Stack.Screen name="privacy" options={{ headerShown: false }} />
              <Stack.Screen name="x-academy" options={{ headerShown: false }} />
              <Stack.Screen name="wakti" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops! Not Found' }} />
            </Stack>
            <AppUpdatePrompt />
          </>
        ) : appReady && profileError ? (
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StateSurface kind={isOnline ? 'error' : 'offline'} onRetry={refreshProfile} />
          </View>
        ) : null}

        {(!appReady || showSplash || (!startupRouteResolved && !profileError)) ? (
          <View style={StyleSheet.absoluteFill}>
            <CustomSplash onFinish={onSplashFinish} />
          </View>
        ) : null}
      </View>
    </ThemeProvider>
  );
}

const startupStyles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { minWidth: 160, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: 10 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
