import { Ionicons } from '@expo/vector-icons';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';

type Props = {
    onPress?: () => void;
};

export default function HelpLink({ onPress }: Props) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.linkContainer}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#666666" />
                </View>
                <Text style={styles.linkText}>{t('how_does_this_work')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    linkContainer: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginEnd: 6,
    },
    linkText: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#666666',
    },
});
