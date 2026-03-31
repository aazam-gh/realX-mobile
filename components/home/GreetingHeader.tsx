import { Image, I18nManager, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../ThemedText';

type Props = {
    userName: string;
};

export default function GreetingHeader({ userName }: Props) {
    const { colorScheme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const isDark = colorScheme === 'dark';

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <ThemedText style={styles.greeting}>
                    {t('hey')}{' '}
                    <ThemedText style={styles.userName}>{userName}</ThemedText>,
                </ThemedText>
                <ThemedText style={styles.subtitle}>{t('ready_to_save')}</ThemedText>
            </View>
            <TouchableOpacity
                style={styles.avatarContainer}
                onPress={toggleTheme}
                activeOpacity={0.8}
            >
                <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                    <Image
                        source={require('../../assets/images/user.png')}
                        style={styles.avatarImage}
                    />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    textContainer: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    userName: {
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    subtitle: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    avatarContainer: {
        width: 60,
        height: 60,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: Colors.brandGreen,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});
