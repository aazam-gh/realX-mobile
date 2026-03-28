import { Ionicons } from '@expo/vector-icons';
import { Dimensions, I18nManager, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../constants/Typography';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = 200;

type Props = {
    earnings?: number;
    currency?: string;
};

export default function XCard({ earnings = 0, currency = 'QAR' }: Props) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.patternContainer}>
                    {[...Array(8)].map((_, rowIndex) => (
                        <View key={rowIndex} style={styles.patternRow}>
                            {[...Array(5)].map((_, colIndex) => (
                                <Text key={colIndex} style={styles.patternText}>
                                    REALX
                                </Text>
                            ))}
                        </View>
                    ))}
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.earningsSection}>
                        <Text style={styles.earningsLabel}>{t('cashback_balance')}</Text>
                        <View style={styles.earningsRow}>
                            <Text style={styles.earningsAmount}>
                                {earnings} {currency}
                            </Text>
                            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" style={styles.coinIcon} />
                        </View>
                    </View>

                    <View style={styles.brandingContainer}>
                        <Text style={styles.brandReal}>real</Text>
                        <Text style={styles.brandX}>X</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        backgroundColor: '#0A3D2E',
        overflow: 'hidden',
        position: 'relative',
    },
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
        transform: [{ rotate: '-15deg' }],
        top: -20,
        left: -30,
    },
    patternRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    patternText: {
        fontSize: 14,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
        marginRight: 20,
        letterSpacing: 2,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    earningsSection: {
        marginTop: 4,
    },
    earningsLabel: {
        fontSize: 14,
        fontFamily: Typography.metropolis.medium,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 4,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    earningsRow: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
    },
    earningsAmount: {
        fontSize: 28,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
    },
    coinIcon: {
        marginStart: 8,
    },
    brandingContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    brandReal: {
        fontSize: 32,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
    },
    brandX: {
        fontSize: 36,
        fontFamily: Typography.integral.bold,
        color: '#18B852',
    },
});
