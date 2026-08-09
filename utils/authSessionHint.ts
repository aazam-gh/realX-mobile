import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_HINT_KEY = 'realx.authSessionHint.v1';

export async function getStoredAuthSessionHint() {
  return (await AsyncStorage.getItem(AUTH_SESSION_HINT_KEY)) === 'authenticated';
}

export async function setStoredAuthSessionHint() {
  await AsyncStorage.setItem(AUTH_SESSION_HINT_KEY, 'authenticated');
}

export async function clearStoredAuthSessionHint() {
  await AsyncStorage.removeItem(AUTH_SESSION_HINT_KEY);
}
