import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import MascotThemeButton from './MascotThemeButton';

type Props = {
    userName: string;
    savings: number;
};

const USER_NAME_PLACEHOLDER = '__USER_NAME__';

export default function GreetingHeader({ userName, savings }: Props) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isRTL } = useAppLocale();
    const textAlignStyle = { textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' };
    const rawGreeting = t('greeting_line', { name: USER_NAME_PLACEHOLDER });
    const [prefix, suffix] = rawGreeting.split(USER_NAME_PLACEHOLDER);

    const greetingTextBlock = (
        <View style={[styles.textContainer, isRTL && styles.textContainerRTL]}>
            <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('body') }, styles.greeting, textAlignStyle]}>
                {prefix}
                <Text style={{ color: theme.brand, ...Typography.getTextVariantStyle('display') }}>{userName}</Text>
                {suffix ?? ''}
            </Text>
            <Text style={[{ color: theme.text, ...Typography.getTextVariantStyle('body') }, styles.subtitle, textAlignStyle]}>
                {t('greeting_savings_prefix')}
                <Text style={[{ color: theme.brand }, styles.savingsValue]}>
                    {savings.toFixed(0)} {t('currency_qar')}
                </Text>
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
        paddingHorizontal: 20,
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
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    subtitle: {
        fontSize: 20,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    savingsValue: {
        ...Typography.getTextVariantStyle('display'),
        fontVariant: ['tabular-nums'],
    },
});
