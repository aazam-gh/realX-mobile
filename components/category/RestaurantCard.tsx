import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Props = {
    id: string;
    name: string;
    cashbackText?: string;
    discountText?: string;
    isTrending?: boolean;
    imageUri?: string;
    onPress?: () => void;
};

export default function RestaurantCard({
    name,
    cashbackText = 'Cashbacks',
    discountText = '60% DISCOUNT',
    isTrending = false,
    imageUri,
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Image placeholder or actual image */}
            <View style={styles.imageContainer}>
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={styles.placeholderEmoji}>🍽️</Text>
                    </View>
                )}

                {/* Logo placeholder - only show if no image, or maybe overlay? keeping meaningful default behavior */}
                {!imageUri && (
                    <View style={styles.logoContainer}>
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoEmoji}>🏪</Text>
                        </View>
                    </View>
                )}

                {/* Trending badge */}
                {isTrending && (
                    <View style={styles.trendingBadge}>
                        <Text style={styles.trendingIcon}>🔥</Text>
                        <Text style={styles.trendingText}>TRENDING</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <View style={styles.cashbackRow}>
                    <Ionicons name="location" size={14} color={Colors.brandGreen} />
                    <Text style={styles.cashbackText}>{cashbackText}</Text>
                </View>
                <Text style={styles.discountText}>% {discountText}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 180,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: 120,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 40,
        opacity: 0.3,
    },
    logoContainer: {
        position: 'absolute',
        left: 10,
        bottom: 10,
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    logoEmoji: {
        fontSize: 20,
    },
    trendingBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brandGreen,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trendingIcon: {
        fontSize: 10,
    },
    trendingText: {
        fontSize: 10,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    content: {
        padding: 12,
    },
    name: {
        fontSize: 16,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
        marginBottom: 4,
    },
    cashbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    cashbackText: {
        fontSize: 12,
        fontFamily: Typography.metropolis.medium,
        color: '#666666',
    },
    discountText: {
        fontSize: 13,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.brandGreen,
    },
});
