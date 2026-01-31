import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Typography } from '../../constants/Typography';

type Props = {
    title: string;
    subtitle: string;
    discount?: string;
    backgroundColor: string;
    accentColor?: string;
    onPress?: () => void;
};

export default function PromoCard({
    title,
    subtitle,
    discount,
    backgroundColor,
    accentColor = '#FFFFFF',
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Placeholder for promo image/illustration */}
            <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderEmoji}>🎁</Text>
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>
                {discount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.flashIcon}>⚡</Text>
                        <Text style={styles.discountText}>{discount}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 140,
        borderRadius: 16,
        overflow: 'hidden',
        padding: 16,
        justifyContent: 'space-between',
    },
    imagePlaceholder: {
        position: 'absolute',
        right: 10,
        top: 10,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 50,
        opacity: 0.3,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Typography.metropolis.semiBold,
        fontStyle: 'italic',
        marginTop: 2,
    },
    discountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: 8,
    },
    flashIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    discountText: {
        fontSize: 12,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
    },
});
