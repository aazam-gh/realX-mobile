import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import MascotThemeButton from './MascotThemeButton';
import { HOME_HORIZONTAL_GUTTER } from './layout';

type Props = {
    userName: string;
    savings: number;
};

export default function GreetingHeader({ userName, savings }: Props) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isRTL } = useAppLocale();
    const textAlignStyle = { textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' };

    const greetingTextBlock = (
        <View style={[styles.textContainer, isRTL && styles.textContainerRTL]}>
            <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('display') }, styles.greeting, textAlignStyle]}>
                {t('greeting_prefix')}
                <Text style={{ color: theme.brand, ...Typography.getTextVariantStyle('display') }}>{userName}</Text>
            </Text>
            <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('display') }, styles.subtitle, textAlignStyle]}>
                <Text style={[{ color: theme.brand }, styles.savingsValue]}>
                    {savings.toFixed(0)} {t('currency_qar')}
                </Text>
                {t('greeting_savings_suffix')}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {greetingTextBlock}
            <MascotThemeButton />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: HOME_HORIZONTAL_GUTTER,
        paddingVertical: 8,
    },
    textContainer: {
        flex: 1,
    },
    textContainerRTL: {
        alignItems: 'flex-start',
    },
    greeting: {
        fontSize: 28,
        ...Typography.getTextVariantStyle('display'),
    },
    subtitle: {
        fontSize: 20,
        ...Typography.getTextVariantStyle('display'),
    },
    savingsValue: {
        ...Typography.getTextVariantStyle('display'),
        fontVariant: ['tabular-nums'],
    },
});
