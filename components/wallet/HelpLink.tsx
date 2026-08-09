import { StyleSheet, Text, View } from 'react-native';
import ScalePressable from '../ScalePressable';
import { Typography } from '../../constants/Typography';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';

type Props = {
    onPress?: () => void;
    onTermsPress?: () => void;
};

export default function HelpLink({ onPress, onTermsPress }: Props) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isRTL } = useAppLocale();
    return (
        <View style={styles.container}>
            <ScalePressable
                style={styles.linkContainer}
                onPress={() => {
                    triggerSubtleHaptic();
                    onPress?.();
                }}
                pressedScale={0.96}
            >
                <View style={[styles.iconContainer, isRTL && styles.iconContainerRTL]}>
                    <Text style={[styles.icon, { color: theme.mutedText }]}>ⓘ</Text>
                </View>
                <Text style={[styles.linkText, { color: theme.mutedText, textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('help_link_text')}
                </Text>
            </ScalePressable>
            <Text style={[styles.conversionText, { color: theme.brandText }]}>{t('xp_conversion_text')}</Text>
            <ScalePressable
                onPress={() => {
                    triggerSubtleHaptic();
                    onTermsPress?.();
                }}
                pressedScale={0.96}
                accessibilityRole="button"
                accessibilityLabel={t('rewards_terms_link')}
                style={styles.termsLink}
            >
                <Text style={[styles.termsLinkText, { color: theme.mutedText }]}>{t('rewards_terms_link')}</Text>
            </ScalePressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 6,
    },
    iconContainerRTL: {
        marginRight: 0,
        marginLeft: 6,
    },
    icon: {
        fontSize: 16,
    },
    linkText: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
    },
    conversionText: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
    },
    termsLink: {
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    termsLinkText: {
        fontSize: 13,
        textDecorationLine: 'underline',
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
});
