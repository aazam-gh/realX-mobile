import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import i18n from '../src/localization/i18n';
import { logger } from '../utils/logger';

const GUEST_SESSION_KEY = 'realx.guestSession.v1';

type AuthAccessContextValue = {
  firebaseUser: FirebaseAuthTypes.User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  continueAsGuest: () => Promise<void>;
  endGuestSession: () => Promise<void>;
  requireAuth: (messageKey?: string) => boolean;
};

const AuthAccessContext = createContext<AuthAccessContextValue | undefined>(undefined);

export async function clearStoredGuestSession() {
  await AsyncStorage.removeItem(GUEST_SESSION_KEY);
}

async function setStoredGuestSession() {
  await AsyncStorage.setItem(GUEST_SESSION_KEY, 'true');
}

async function getStoredGuestSession() {
  return (await AsyncStorage.getItem(GUEST_SESSION_KEY)) === 'true';
}

export function AuthAccessProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const authSubscriber = onAuthStateChanged(getAuth(), async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          await clearStoredGuestSession();
        } catch (error) {
          logger.warn('Unable to clear guest session after auth:', error);
        }
        if (!cancelled) {
          setIsGuest(false);
          setLoading(false);
        }
        return;
      }

      try {
        const storedGuest = await getStoredGuestSession();
        if (!cancelled) {
          setIsGuest(storedGuest);
          setLoading(false);
        }
      } catch (error) {
        logger.warn('Unable to read guest session:', error);
        if (!cancelled) {
          setIsGuest(false);
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      authSubscriber();
    };
  }, []);

  const endGuestSession = useCallback(async () => {
    await clearStoredGuestSession();
    setIsGuest(false);
  }, []);

  const continueAsGuest = useCallback(async () => {
    await setStoredGuestSession();
    setIsGuest(true);
    router.replace('/(tabs)' as any);
  }, [router]);

  const requireAuth = useCallback((messageKey = 'guest_auth_required_message') => {
    if (getAuth().currentUser) {
      return true;
    }

    Alert.alert(
      i18n.t('guest_auth_required_title'),
      i18n.t(messageKey),
      [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('onboarding_login_action'),
          onPress: () => {
            void endGuestSession().finally(() => {
              router.push('/(onboarding)/login' as any);
            });
          },
        },
        {
          text: i18n.t('onboarding_sign_up'),
          onPress: () => {
            void endGuestSession().finally(() => {
              router.push('/(onboarding)' as any);
            });
          },
        },
      ]
    );

    return false;
  }, [endGuestSession, router]);

  const value = useMemo<AuthAccessContextValue>(() => ({
    firebaseUser,
    isGuest,
    isAuthenticated: !!firebaseUser,
    loading,
    continueAsGuest,
    endGuestSession,
    requireAuth,
  }), [continueAsGuest, endGuestSession, firebaseUser, isGuest, loading, requireAuth]);

  return (
    <AuthAccessContext.Provider value={value}>
      {children}
    </AuthAccessContext.Provider>
  );
}

export function useAuthAccess() {
  const context = useContext(AuthAccessContext);
  if (!context) {
    throw new Error('useAuthAccess must be used within AuthAccessProvider');
  }
  return context;
}
