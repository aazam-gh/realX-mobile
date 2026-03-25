import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Typography } from '../../constants/Typography';

type Props = {
    onPress?: () => void;
};

export default function HelpLink({ onPress }: Props) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.linkContainer}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>ⓘ</Text>
                </View>
                <Text style={styles.linkText}>How does this work?</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 6,
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
});
