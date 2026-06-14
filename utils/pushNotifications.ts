import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { logger } from './logger';

const PUSH_TOKEN_STORAGE_KEY = 'registered_expo_push_token';
const PUSH_TOKEN_SYNC_STORAGE_KEY = 'expo_push_token_sync';
const PUSH_TOKEN_REFRESH_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

type StoredPushTokenSync = {
  token: string;
  uid: string;
  syncedAt: number;
};

const getStoredPushTokenSync = async (): Promise<StoredPushTokenSync | null> => {
  const value = await AsyncStorage.getItem(PUSH_TOKEN_SYNC_STORAGE_KEY);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredPushTokenSync>;
    if (
      typeof parsed.token === 'string' &&
      typeof parsed.uid === 'string' &&
      typeof parsed.syncedAt === 'number'
    ) {
      return parsed as StoredPushTokenSync;
    }
  } catch {
    // A malformed local cache should trigger a fresh server sync.
  }

  return null;
};

export const getExpoProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    undefined
  );
};

export const registerForExpoPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    logger.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.warn('Push notification permissions not granted');
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    logger.warn('Missing Expo projectId for push notification registration');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
};

const registerPushTokenViaCallable = async (token: string, uid: string) => {
  const regions = ['me-central1', 'us-central1'] as const;
  let lastError: unknown;

  for (const region of regions) {
    try {
      const functions = getFunctions(undefined, region);
      const registerPushToken = httpsCallable(functions, 'registerPushToken');
      await registerPushToken({
        token,
        platform: Platform.OS,
      });
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      await AsyncStorage.setItem(
        PUSH_TOKEN_SYNC_STORAGE_KEY,
        JSON.stringify({ token, uid, syncedAt: Date.now() } satisfies StoredPushTokenSync),
      );
      return;
    } catch (error: any) {
      lastError = error;
      const code = String(error?.code || '').toLowerCase();
      const message = String(error?.message || '').toLowerCase();
      const isNotFound = code.includes('not-found') || message.includes('not found');

      if (!isNotFound) {
        throw error;
      }
    }
  }

  throw lastError;
};

const isUnauthenticatedError = (error: unknown) => {
  const code = String((error as any)?.code || '').toLowerCase();
  const message = String((error as any)?.message || '').toLowerCase();
  return code.includes('unauthenticated') || message.includes('unauthenticated');
};

export const syncExpoPushTokenForUser = async (uid: string) => {
  const token = await registerForExpoPushNotificationsAsync();
  if (!token) return null;

  const storedSync = await getStoredPushTokenSync();
  if (
    storedSync?.token === token &&
    storedSync.uid === uid &&
    Date.now() - storedSync.syncedAt < PUSH_TOKEN_REFRESH_INTERVAL_MS
  ) {
    return token;
  }

  try {
    await registerPushTokenViaCallable(token, uid);
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      try {
        const currentUser = getAuth().currentUser;
        if (!currentUser) {
          throw error;
        }

        await getIdToken(currentUser, true);
        await registerPushTokenViaCallable(token, uid);
        return token;
      } catch (retryError) {
        logger.warn('registerPushToken callable retry failed after token refresh', {
          uid,
          error: retryError,
        });
        return null;
      }
    }

    logger.warn('registerPushToken callable failed; token was not synced', {
      uid,
      error,
    });
    return null;
  }

  return token;
};

export const unregisterExpoPushTokenForCurrentUser = async () => {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (!token || !getAuth().currentUser) return;

  try {
    const functions = getFunctions(undefined, 'me-central1');
    const unregisterPushToken = httpsCallable(functions, 'unregisterPushToken');
    await unregisterPushToken({ token });
    await AsyncStorage.multiRemove([
      PUSH_TOKEN_STORAGE_KEY,
      PUSH_TOKEN_SYNC_STORAGE_KEY,
    ]);
  } catch (error) {
    logger.warn('Unable to unregister Expo push token before sign-out', { error });
  }
};
