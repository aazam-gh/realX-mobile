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
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import AppUpdatePrompt from '../components/AppUpdatePrompt';
import { LocaleProvider, useAppLocale } from '../context/LocaleContext';
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
import {
  clearStoredAuthSessionHint,
  getStoredAuthSessionHint,
  setStoredAuthSessionHint,
} from '../utils/authSessionHint';
import { trackEvent } from '../utils/analytics';
import { preloadHomeData } from '../utils/homeQueries';
import { trackOnboarding } from '../utils/onboarding';
import {
  getStartupInitialRootRoute,
  isStartupRouteReady,
  resolveStartupDestination,
} from '../utils/startupRouting';

import { StateSurface } from '../components/StateSurface';

SplashScreen.setOptions({
  duration: 450,
  fade: true,
});

void SplashScreen.preventAutoHideAsync().catch((error) => {
  logger.warn('Unable to hold the native splash screen:', error);
});

const AUTH_RESTORE_GRACE_MS = 2500;
const MIN_NATIVE_SPLASH_VISIBLE_MS = 700;
const nativeSplashStartedAt = Date.now();

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
  const [initializing, setInitializing] = useState(() => getAuth().currentUser === null);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(() => getAuth().currentUser);
  const [authHintChecked, setAuthHintChecked] = useState(false);
  const [hadAuthenticatedSession, setHadAuthenticatedSession] = useState(false);
  const [authRestoreGraceDone, setAuthRestoreGraceDone] = useState(false);

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
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, (currentUser) => {
      const resolvedUser = currentUser ?? auth.currentUser;
      setUser(resolvedUser);
      if (resolvedUser) {
        setHadAuthenticatedSession(true);
        void setStoredAuthSessionHint().catch((error) => {
          logger.warn('Unable to store the authenticated-session hint:', error);
        });
      }
      setInitializing(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getStoredAuthSessionHint()
      .then((hasHint) => {
        if (!cancelled) setHadAuthenticatedSession(hasHint || Boolean(getAuth().currentUser));
      })
      .catch((error) => {
        logger.warn('Unable to read the authenticated-session hint:', error);
      })
      .finally(() => {
        if (!cancelled) setAuthHintChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authHintChecked) return;
    if (user || !hadAuthenticatedSession) {
      setAuthRestoreGraceDone(true);
      return;
    }

    setAuthRestoreGraceDone(false);
    const timer = setTimeout(() => {
      setHadAuthenticatedSession(false);
      setAuthRestoreGraceDone(true);
      void clearStoredAuthSessionHint().catch((error) => {
        logger.warn('Unable to clear the stale authenticated-session hint:', error);
      });
    }, AUTH_RESTORE_GRACE_MS);

    return () => clearTimeout(timer);
  }, [authHintChecked, hadAuthenticatedSession, user]);

  const authReady = Boolean(
    !initializing
    && authHintChecked
    && (user || !hadAuthenticatedSession || authRestoreGraceDone),
  );

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
                  authReady={authReady}
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
  authReady,
}: {
  user: FirebaseAuthTypes.User | null;
  loaded: boolean;
  error: Error | null;
  i18nReady: boolean;
  appCheckReady: boolean;
  authReady: boolean;
}) {
  const { docExists: hasProfile, error: profileError, refreshProfile } = useStudent();
  const { isGuest, loading: guestLoading } = useAuthAccess();
  const { isDark, theme } = useAppTheme();
  const { locale } = useAppLocale();
  const { isOnline } = useConnectivity();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const [appReady, setAppReady] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<PendingVerificationData | null>(null);
  const [pendingCheckDone, setPendingCheckDone] = useState(false);
  const [validatedMissingProfileUid, setValidatedMissingProfileUid] = useState<string | null>(null);
  const [startupTimedOut, setStartupTimedOut] = useState(false);
  const [homePreloadReady, setHomePreloadReady] = useState(false);
  const [startupRevealComplete, setStartupRevealComplete] = useState(false);
  const [rootLaidOut, setRootLaidOut] = useState(false);
  const startupStartedAt = useRef<number | null>(null);
  const splashHiddenRef = useRef(false);
  const splashHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileNavigationStartedRef = useRef(false);
  const preloadedHomeLocaleRef = useRef<string | null>(null);
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

  const startupDestination = useMemo(() => {
    if (!appReady || profileError) return null;
    return resolveStartupDestination({
      hasUser: Boolean(user),
      hasProfile,
      isGuest,
      hasPendingVerification: Boolean(pendingVerification),
      missingProfileValidated: Boolean(user && validatedMissingProfileUid === user.uid),
      segments: segments as string[],
    });
  }, [appReady, hasProfile, isGuest, pendingVerification, profileError, segments, user, validatedMissingProfileUid]);

  const startupRouteReady = startupDestination
    ? isStartupRouteReady(startupDestination, segments as string[])
    : false;
  const startupPrerequisitesReady = Boolean(
    appReady
    && (
      profileError
      || (
        startupDestination
        && startupRouteReady
        && (startupDestination !== 'home' || homePreloadReady)
      )
    ),
  );
  const startupCanReveal = startupRevealComplete || startupPrerequisitesReady;

  useEffect(() => {
    if (startupStartedAt.current === null) startupStartedAt.current = Date.now();
    void getPendingVerification()
      .then((data) => {
        setPendingVerification(data);
      })
      .catch((error) => {
        logger.warn('Unable to read pending verification state:', error);
      })
      .finally(() => {
        setPendingCheckDone(true);
      });
  }, []);

  useEffect(() => {
    if (
      i18nReady &&
      appCheckReady &&
      (loaded || error) &&
      authReady &&
      !guestLoading &&
      (user === null || hasProfile !== null || profileError !== null) &&
      pendingCheckDone
    ) {
      setAppReady(true);
    }
  }, [i18nReady, appCheckReady, loaded, error, authReady, guestLoading, user, hasProfile, profileError, pendingCheckDone]);

  useEffect(() => {
    if (startupPrerequisitesReady) setStartupRevealComplete(true);
  }, [startupPrerequisitesReady]);

  useEffect(() => {
    if (startupCanReveal) {
      setStartupTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setStartupTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [startupCanReveal]);

  useEffect(() => {
    if (startupDestination !== 'home') {
      setHomePreloadReady(true);
      return;
    }

    if (preloadedHomeLocaleRef.current === locale) {
      setHomePreloadReady(true);
      return;
    }

    let cancelled = false;
    preloadedHomeLocaleRef.current = locale;
    if (!startupRevealComplete) setHomePreloadReady(false);
    const preload = preloadHomeData(locale);

    void preload.criticalReady.finally(() => {
      if (!cancelled) setHomePreloadReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [locale, startupDestination, startupRevealComplete]);

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
    if (!appReady || !startupDestination) return;

    const inAuthGroup = (segments as string[]).includes('(onboarding)');
    const currentPath = segments.join('/');

    if (startupDestination !== 'profile-completion') {
      profileNavigationStartedRef.current = false;
    }

    if (startupDestination === 'home' && String(segments[0] || '') !== '(tabs)') {
      router.replace('/(tabs)' as any);
      return;
    }

    if (startupDestination === 'onboarding' && !inAuthGroup) {
      router.replace('/(onboarding)' as any);
      return;
    }

    if (startupDestination === 'pending-verification' && !currentPath.includes('pending')) {
      if (!pendingVerification) return;
      router.replace({
        pathname: '/(onboarding)/pending',
        params: {
          email: pendingVerification.email,
          role: pendingVerification.role,
          statusToken: pendingVerification.statusToken,
        },
      } as any);
      return;
    }

    if (
      startupDestination === 'profile-completion'
      && !currentPath.includes('details')
      && !profileNavigationStartedRef.current
    ) {
      profileNavigationStartedRef.current = true;

      const fetchRoleAndNavigate = async () => {
        let role: string | undefined;
        try {
          if (user?.email && pendingVerification?.statusToken) {
            const fnInstance = getFunctions(undefined, 'me-central1');
            const checkStatus = httpsCallable(fnInstance, 'checkVerificationStatus');
            const result = await checkStatus({
              email: user.email,
              statusToken: pendingVerification.statusToken,
            });
            const data = result.data as { status: string; role?: string };
            if (data.status !== 'none') role = data.role;
          }
        } catch {
          // details.tsx safely defaults to the student role.
        }

        router.replace({
          pathname: '/(onboarding)/details',
          params: role ? { role } : undefined,
        } as any);
      };

      void fetchRoleAndNavigate();
    }
  }, [appReady, pendingVerification, router, segments, startupDestination, user]);

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

  useEffect(() => {
    if (!rootLaidOut || splashHiddenRef.current) return;
    if (!startupTimedOut && !startupCanReveal) return;

    const remainingVisibleMs = Math.max(
      0,
      MIN_NATIVE_SPLASH_VISIBLE_MS - (Date.now() - nativeSplashStartedAt),
    );

    splashHideTimerRef.current = setTimeout(() => {
      splashHideTimerRef.current = null;
      if (splashHiddenRef.current) return;

      splashHiddenRef.current = true;
      void SplashScreen.hideAsync().catch((error) => {
        splashHiddenRef.current = false;
        logger.warn('Unable to hide the native splash screen:', error);
      });
    }, remainingVisibleMs);

    return () => {
      if (splashHideTimerRef.current) {
        clearTimeout(splashHideTimerRef.current);
        splashHideTimerRef.current = null;
      }
    };
  }, [rootLaidOut, startupCanReveal, startupTimedOut]);

  if (startupTimedOut) {
    return <ThemeProvider value={navigationTheme}><View onLayout={() => setRootLaidOut(true)} style={[startupStyles.screen, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.brand} />
      <Text style={[startupStyles.title, { color: theme.text }]}>{t('onboarding_v2_startup_title')}</Text>
      <Text style={[startupStyles.body, { color: theme.mutedText }]}>{t('onboarding_v2_startup_body')}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => void Updates.reloadAsync()} style={[startupStyles.button, { backgroundColor: theme.actionSolid }]}><Text style={[startupStyles.buttonText, { color: theme.onActionSolid }]}>{t('retry')}</Text></TouchableOpacity>
    </View></ThemeProvider>;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <View
        onLayout={() => setRootLaidOut(true)}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        {appReady && !profileError && startupDestination ? (
          <View
            pointerEvents={startupCanReveal ? 'auto' : 'none'}
            style={[startupStyles.navigation, !startupCanReveal && startupStyles.navigationPending]}
          >
            <Stack initialRouteName={getStartupInitialRootRoute(startupDestination)}>
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
              <Stack.Screen name="edit-profile-details" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="terms" options={{ headerShown: false }} />
              <Stack.Screen name="privacy" options={{ headerShown: false }} />
              <Stack.Screen name="x-academy" options={{ headerShown: false }} />
              <Stack.Screen name="wakti" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops! Not Found' }} />
            </Stack>
            {startupCanReveal ? <AppUpdatePrompt /> : null}
          </View>
        ) : appReady && profileError ? (
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StateSurface kind={isOnline ? 'error' : 'offline'} onRetry={refreshProfile} />
          </View>
        ) : !startupTimedOut ? (
          <View style={[startupStyles.splash, { backgroundColor: theme.background }]}>
            <Image
              accessibilityLabel="realX"
              source={require('../assets/images/splash.png')}
              style={[StyleSheet.absoluteFill, startupStyles.splashIcon]}
            />
          </View>
        ) : null}

      </View>
    </ThemeProvider>
  );
}

const startupStyles = StyleSheet.create({
  navigation: { flex: 1 },
  navigationPending: { opacity: 0 },
  splash: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  splashIcon: { resizeMode: 'cover' },
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { minWidth: 160, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: 10 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
