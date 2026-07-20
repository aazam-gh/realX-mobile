import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Typography } from '../constants/Typography';
import { useAppTheme } from '../context/AppThemeContext';
import { type AppLocale, useAppLocale } from '../context/LocaleContext';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function LanguagePickerModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { locale, isRTL, isChanging, changeLocale } = useAppLocale();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectLanguage = async (nextLocale: AppLocale) => {
    setErrorMessage(null);
    try {
      await changeLocale(nextLocale);
      onClose();
    } catch {
      setErrorMessage(t('language_change_failed'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border, direction: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          <Text style={[styles.title, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('select_language')}
          </Text>
          {(['en', 'ar'] as const).map((option) => {
            const selected = locale === option;
            return (
              <Pressable
                key={option}
                disabled={isChanging}
                onPress={() => void selectLanguage(option)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: isChanging }}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: selected ? theme.brand : theme.border, backgroundColor: selected ? theme.brandSoft : theme.cardMuted },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {option === 'en' ? t('english') : t('arabic')}
                </Text>
                <View style={[styles.radio, { borderColor: selected ? theme.brand : theme.borderStrong }]}>
                  {selected ? <View style={[styles.radioDot, { backgroundColor: theme.brand }]} /> : null}
                </View>
              </Pressable>
            );
          })}
          {errorMessage ? (
            <Text style={[styles.error, { color: theme.danger }]} accessibilityRole="alert">
              {errorMessage}
            </Text>
          ) : null}
          <Pressable onPress={onClose} style={styles.cancelButton} disabled={isChanging}>
            <Text style={[styles.cancelText, { color: theme.mutedText }]}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    ...Typography.getTextVariantStyle('bodyStrong'),
    marginBottom: 4,
  },
  option: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  error: {
    ...Typography.getTextVariantStyle('body'),
    textAlign: 'center',
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Typography.getTextVariantStyle('bodyStrong'),
  },
  pressed: {
    opacity: 0.8,
  },
});
