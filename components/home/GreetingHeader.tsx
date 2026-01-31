import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    userName: string;
};

export default function GreetingHeader({ userName }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.greeting}>
                    Hey <Text style={styles.userName}>{userName}</Text>,
                </Text>
                <Text style={styles.subtitle}>Ready to save?</Text>
            </View>
            <View style={styles.avatarContainer}>
                {/* Placeholder for mascot avatar */}
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarEmoji}>🙂</Text>
                </View>
            </View>
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
        color: Colors.light.text,
    },
    userName: {
        color: Colors.brandGreen,
        fontFamily: Typography.metropolis.semiBold,
    },
    subtitle: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
    },
    avatarContainer: {
        width: 60,
        height: 60,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
        borderWidth: 2,
        borderColor: Colors.brandGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEmoji: {
        fontSize: 30,
    },
});
