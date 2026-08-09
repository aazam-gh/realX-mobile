import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import ar from './locales/ar.json';

export const LANGUAGE_KEY = 'app_language';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

// Register the React adapter before any component calls useTranslation.
// Initialize a synchronous device-language fallback, then apply any stored
// preference during app startup.
// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next);

function getDeviceLanguage(): 'en' | 'ar' {
  const locales = getLocales();
  const languageCode = locales?.[0]?.languageCode ?? 'en';
  return languageCode === 'ar' ? 'ar' : 'en';
}

// eslint-disable-next-line import/no-named-as-default-member
void i18next.init({
  compatibilityJSON: 'v4',
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  initImmediate: false,
});

export async function getStoredLanguage(): Promise<'en' | 'ar' | null> {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (value === 'en' || value === 'ar') return value;
    return null;
  } catch {
    return null;
  }
}

export async function setStoredLanguage(language: 'en' | 'ar') {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function clearStoredLanguage() {
  await AsyncStorage.removeItem(LANGUAGE_KEY);
}

export async function initI18n() {
  const storedLanguage = await getStoredLanguage();
  const initialLanguage = storedLanguage ?? getDeviceLanguage();

  // eslint-disable-next-line import/no-named-as-default-member
  await i18next.changeLanguage(initialLanguage);

  return initialLanguage;
}

export default i18next;
