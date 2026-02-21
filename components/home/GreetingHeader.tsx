import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { ThemedText } from '../ThemedText';

type Props = {
    userName: string;
};

export default function GreetingHeader({ userName }: Props) {
    const { colorScheme, toggleTheme, theme: activeColors } = useTheme();
    const isDark = colorScheme === 'dark';


    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <ThemedText style={styles.greeting}>
                    Hey <ThemedText style={styles.userName}>{userName}</ThemedText>,
                </ThemedText>
                <ThemedText style={styles.subtitle}>Ready to save?</ThemedText>
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
        flexDirection: 'row',
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
    },
    userName: {
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    subtitle: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
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
