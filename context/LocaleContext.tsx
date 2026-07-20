import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import i18n, {
  clearStoredLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from '../src/localization/i18n';

export type AppLocale = 'en' | 'ar';
export type AppDirection = 'ltr' | 'rtl';

type LocaleContextValue = {
  locale: AppLocale;
  direction: AppDirection;
  isRTL: boolean;
  isChanging: boolean;
  changeLocale: (locale: AppLocale) => Promise<void>;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

function normalizeLocale(language: string | undefined): AppLocale {
  return language?.split('-')[0] === 'ar' ? 'ar' : 'en';
}

export function LocaleProvider({ children }: React.PropsWithChildren) {
  const [locale, setLocale] = useState<AppLocale>(() => normalizeLocale(i18n.resolvedLanguage ?? i18n.language));
  const [pendingChanges, setPendingChanges] = useState(0);
  const localeRef = useRef(locale);
  const operationRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    const handleLanguageChanged = (language: string) => {
      const nextLocale = normalizeLocale(language);
      localeRef.current = nextLocale;
      setLocale(nextLocale);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const performLocaleChange = useCallback(async (nextLocale: AppLocale) => {
    const previousLocale = localeRef.current;
    if (previousLocale === nextLocale) return;

    const previousStoredLocale = await getStoredLanguage();
    setPendingChanges((count) => count + 1);

    try {
      await setStoredLanguage(nextLocale);
      await i18n.changeLanguage(nextLocale);
      localeRef.current = nextLocale;
      setLocale(nextLocale);
    } catch (error) {
      if (previousStoredLocale) {
        await setStoredLanguage(previousStoredLocale).catch(() => undefined);
      } else {
        await clearStoredLanguage().catch(() => undefined);
      }

      if (normalizeLocale(i18n.resolvedLanguage ?? i18n.language) !== previousLocale) {
        await i18n.changeLanguage(previousLocale).catch(() => undefined);
      }

      localeRef.current = previousLocale;
      setLocale(previousLocale);
      throw error;
    } finally {
      setPendingChanges((count) => Math.max(0, count - 1));
    }
  }, []);

  const changeLocale = useCallback((nextLocale: AppLocale) => {
    const operation = operationRef.current.then(
      () => performLocaleChange(nextLocale),
      () => performLocaleChange(nextLocale),
    );
    operationRef.current = operation.catch(() => undefined);
    return operation;
  }, [performLocaleChange]);

  const direction: AppDirection = locale === 'ar' ? 'rtl' : 'ltr';
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    direction,
    isRTL: direction === 'rtl',
    isChanging: pendingChanges > 0,
    changeLocale,
  }), [changeLocale, direction, locale, pendingChanges]);

  return (
    <LocaleContext.Provider value={value}>
      <View testID="locale-root" style={{ flex: 1, direction }}>
        {children}
      </View>
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  const context = React.use(LocaleContext);
  if (!context) {
    throw new Error('useAppLocale must be used inside LocaleProvider');
  }
  return context;
}
