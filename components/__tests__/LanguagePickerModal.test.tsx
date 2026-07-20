/// <reference types="jest" />

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { AppThemeProvider } from '../../context/AppThemeContext';
import { LocaleProvider } from '../../context/LocaleContext';
import i18n, { initI18n } from '../../src/localization/i18n';
import LanguagePickerModal from '../LanguagePickerModal';

jest.mock('@react-native-async-storage/async-storage', () => (
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
));
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

async function renderPicker(onClose = jest.fn()) {
  await render(
    <LocaleProvider>
      <AppThemeProvider>
        <LanguagePickerModal visible onClose={onClose} />
      </AppThemeProvider>
    </LocaleProvider>,
  );
  return onClose;
}

describe('LanguagePickerModal', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    await initI18n();
    await i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  test('switches to Arabic, updates direction, and closes without a reload', async () => {
    const user = userEvent.setup();
    const onClose = await renderPicker();

    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: 'Arabic' }));

    expect(await screen.findByText('اختر اللغة')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'العربية' })).toBeChecked();
    expect(screen.getByTestId('locale-root')).toHaveStyle({ direction: 'rtl' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('keeps the active language and displays an error when persistence fails', async () => {
    const user = userEvent.setup();
    const onClose = await renderPicker();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage unavailable'));

    await user.press(screen.getByRole('radio', { name: 'Arabic' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't change the language. Please try again.");
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByTestId('locale-root')).toHaveStyle({ direction: 'ltr' });
    expect(onClose).not.toHaveBeenCalled();
  });

  test('disables choices while a locale change is pending', async () => {
    let finishPersistence: (() => void) | undefined;
    jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(() => (
      new Promise<void>((resolve) => {
        finishPersistence = resolve;
      })
    ));
    await renderPicker();

    await fireEvent.press(screen.getByRole('radio', { name: 'Arabic' }));
    expect(await screen.findByRole('radio', { name: 'English' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Arabic' })).toBeDisabled();

    finishPersistence?.();
    expect(await screen.findByText('اختر اللغة')).toBeOnTheScreen();
  });
});
