/// <reference types="jest" />

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import i18n, { getStoredLanguage, initI18n, LANGUAGE_KEY } from '../i18n';

jest.mock('@react-native-async-storage/async-storage', () => (
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
));
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

const mockedGetLocales = getLocales as jest.MockedFunction<typeof getLocales>;

describe('i18n initialization', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    mockedGetLocales.mockReturnValue([{ languageCode: 'en' }] as unknown as ReturnType<typeof getLocales>);
  });

  test('uses a stored locale before the device locale', async () => {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'en');
    mockedGetLocales.mockReturnValue([{ languageCode: 'ar' }] as unknown as ReturnType<typeof getLocales>);

    await expect(initI18n()).resolves.toBe('en');
    expect(i18n.resolvedLanguage).toBe('en');
  });

  test('uses Arabic for an Arabic device when no choice is stored', async () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'ar' }] as unknown as ReturnType<typeof getLocales>);

    await expect(initI18n()).resolves.toBe('ar');
    expect(i18n.resolvedLanguage).toBe('ar');
  });

  test('falls back to English for unsupported and missing device locales', async () => {
    mockedGetLocales.mockReturnValue([{ languageCode: 'fr' }] as unknown as ReturnType<typeof getLocales>);
    await expect(initI18n()).resolves.toBe('en');

    mockedGetLocales.mockReturnValue([] as unknown as ReturnType<typeof getLocales>);
    await expect(initI18n()).resolves.toBe('en');
  });

  test('ignores invalid stored values and storage read failures', async () => {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'invalid');
    mockedGetLocales.mockReturnValue([{ languageCode: 'ar' }] as unknown as ReturnType<typeof getLocales>);
    await expect(initI18n()).resolves.toBe('ar');

    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'));
    mockedGetLocales.mockReturnValue([{ languageCode: 'en' }] as unknown as ReturnType<typeof getLocales>);
    await expect(getStoredLanguage()).resolves.toBeNull();
  });
});
