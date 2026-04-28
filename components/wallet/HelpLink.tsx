import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Typography } from '../../constants/Typography';
import { useTranslation } from 'react-i18next';

type Props = {
    onPress?: () => void;
};

export default function HelpLink({ onPress }: Props) {
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.linkContainer}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, isRTL && styles.iconContainerRTL]}>
                    <Text style={styles.icon}>ⓘ</Text>
                </View>
                <Text style={[styles.linkText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t('help_link_text')}
                </Text>
            </TouchableOpacity>
            <Text style={styles.conversionText}>1XP = 1 QAR</Text>
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
        color: '#666666',
    },
    linkText: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#666666',
    },
    conversionText: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#28A745',
    },
});
