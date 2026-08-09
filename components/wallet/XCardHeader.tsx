import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import AppHeader from '../navigation/AppHeader';

export default function XCardHeader() {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { locale } = useAppLocale();
    const isArabic = locale === 'ar';

    return (
        <AppHeader
            variant="root"
            titleStyle={isArabic ? styles.titleArabic : undefined}
            title={isArabic ? (
                <>
                    <Text style={{ color: theme.text }}>{t('xcard_title_card')}</Text>
                    {' '}
                    <Text style={{ color: theme.brand }}>{t('xcard_title_x')}</Text>
                </>
            ) : (
                <>
                    <Text style={{ color: theme.brand }}>{t('xcard_title_x')} </Text>
                    <Text style={{ color: theme.text }}>{t('xcard_title_card')}</Text>
                </>
            )}
        />
    );
}

const styles = StyleSheet.create({
    titleArabic: {
        ...Typography.getTextVariantStyle('displayArabicBlack'),
        fontSize: 28,
        lineHeight: 34,
        writingDirection: 'rtl',
    },
});
