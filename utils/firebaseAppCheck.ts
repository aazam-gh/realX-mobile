import { getApp } from '@react-native-firebase/app';
import { initializeAppCheck } from '@react-native-firebase/app-check';
import { Platform } from 'react-native';

import { logger } from './logger';

let appCheckInitializationPromise: Promise<void> | null = null;

async function initializeFirebaseAppCheck(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const debugToken = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;

  await initializeAppCheck(getApp(), {
    provider: {
      providerOptions: {
        android: {
          provider: __DEV__ ? 'debug' : 'playIntegrity',
          debugToken: __DEV__ ? debugToken : undefined,
        },
        apple: {
          provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
          debugToken: __DEV__ ? debugToken : undefined,
        },
      },
    },
    isTokenAutoRefreshEnabled: true,
  });
}

export function ensureFirebaseAppCheck(): Promise<void> {
  if (!appCheckInitializationPromise) {
    appCheckInitializationPromise = initializeFirebaseAppCheck().catch((error) => {
      logger.error('Error initializing Firebase App Check:', error);
      throw error;
    });
  }

  return appCheckInitializationPromise;
}
