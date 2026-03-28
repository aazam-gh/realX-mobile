import { Ionicons } from '@expo/vector-icons';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    onPress?: () => void;
};

export default function SpendButton({ onPress }: Props) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={onPress}
                activeOpacity={0.85}
            >
                <Ionicons name="flash" size={18} color="#FFFFFF" style={styles.lightningIcon} />
                <Text style={styles.buttonText}>{t('spend_the_card')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    button: {
        backgroundColor: Colors.brandGreen,
        borderRadius: 30,
        paddingVertical: 18,
        paddingHorizontal: 24,
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    lightningIcon: {
        marginEnd: 10,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
