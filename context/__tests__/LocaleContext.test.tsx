/// <reference types="jest" />

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import i18n, { initI18n, LANGUAGE_KEY } from '../../src/localization/i18n';
import { type AppLocale, LocaleProvider, useAppLocale } from '../LocaleContext';

jest.mock('@react-native-async-storage/async-storage', () => (
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

let localeApi: ReturnType<typeof useAppLocale> | null = null;

function Probe() {
  const api = useAppLocale();
  const [count, setCount] = useState(0);
  localeApi = api;

  return (
    <View>
      <Text testID="locale">{api.locale}</Text>
      <Text testID="direction">{api.direction}</Text>
      <Text testID="changing">{String(api.isChanging)}</Text>
      <Text testID="count">{count}</Text>
      <Pressable testID="increment" onPress={() => setCount((value) => value + 1)} />
      <Pressable testID="arabic" onPress={() => void api.changeLocale('ar')} />
    </View>
  );
}

describe('LocaleProvider', () => {
  beforeEach(async () => {
    localeApi = null;
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    await initI18n();
    await i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  test('switches language and direction without remounting stateful children', async () => {
    await render(<LocaleProvider><Probe /></LocaleProvider>);

    await fireEvent.press(screen.getByTestId('increment'));
    await fireEvent.press(screen.getByTestId('arabic'));

    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('ar');
      expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
      expect(screen.getByTestId('locale-root')).toHaveStyle({ direction: 'rtl' });
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    await expect(AsyncStorage.getItem(LANGUAGE_KEY)).resolves.toBe('ar');
  });

  test('serializes rapid changes and keeps the final requested locale', async () => {
    await render(<LocaleProvider><Probe /></LocaleProvider>);

    await waitFor(() => expect(localeApi).not.toBeNull());
    await act(async () => {
      await Promise.all([
        localeApi!.changeLocale('ar'),
        localeApi!.changeLocale('en'),
      ]);
    });

    await waitFor(() => expect(localeApi?.locale).toBe('en'));
    expect(localeApi?.direction).toBe('ltr');
    await expect(AsyncStorage.getItem(LANGUAGE_KEY)).resolves.toBe('en');
  });

  test('treats selecting the active locale as a no-op', async () => {
    await render(<LocaleProvider><Probe /></LocaleProvider>);
    const setItem = jest.spyOn(AsyncStorage, 'setItem');

    await waitFor(() => expect(localeApi).not.toBeNull());
    await act(async () => {
      await localeApi!.changeLocale('en');
    });

    expect(setItem).not.toHaveBeenCalled();
  });

  test('rolls back when persistence fails', async () => {
    await render(<LocaleProvider><Probe /></LocaleProvider>);
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage unavailable'));

    await waitFor(() => expect(localeApi).not.toBeNull());
    await act(async () => {
      await expect(localeApi!.changeLocale('ar')).rejects.toThrow('storage unavailable');
    });

    await waitFor(() => {
      expect(localeApi?.locale).toBe('en');
      expect(localeApi?.direction).toBe('ltr');
    });
  });

  test.each<AppLocale>(['en', 'ar'])('exposes a stable direction for %s', async (locale) => {
    await render(<LocaleProvider><Probe /></LocaleProvider>);
    await waitFor(() => expect(localeApi).not.toBeNull());
    await act(async () => {
      await localeApi!.changeLocale(locale);
    });
    await waitFor(() => expect(localeApi?.locale).toBe(locale));
    expect(localeApi?.direction).toBe(locale === 'ar' ? 'rtl' : 'ltr');
  });
});
