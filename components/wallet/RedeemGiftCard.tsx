import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type Brand = {
    id: string;
    name: string;
    logo: string | null;
    backgroundColor?: string;
};

type RedeemGiftCardProps = {
    brand: Brand;
    onBack: () => void;
    maxLimit: number;
    currency: string;
};

const AMOUNTS = [25, 50, 75];

export default function RedeemGiftCard({
    brand,
    onBack,
    maxLimit,
    currency,
}: RedeemGiftCardProps) {
    const [selectedAmount, setSelectedAmount] = useState(AMOUNTS[0]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#000000" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoX}>X</Text>
                    <Text style={styles.logoCard}>CARD</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.inStoreBadge}>In-store</Text>

                    <View style={styles.logoWrapper}>
                        <View style={[styles.brandLogoContainer, { backgroundColor: brand.backgroundColor || '#F0F0F0' }]}>
                            {brand.logo ? (
                                <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
                            ) : (
                                <Text style={styles.brandLogoPlaceholder}>
                                    {brand.name.charAt(0)}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.brandName}>{brand.name}</Text>

                    <View style={styles.generateGiftCardWrapper}>
                        <Text style={styles.generateText}>GENERATE</Text>
                        <Text style={styles.giftCardText}>GIFT CARD</Text>
                    </View>

                    <View style={styles.selectedAmountContainer}>
                        <Text style={styles.selectedAmountText}>
                            {currency} {selectedAmount}
                        </Text>
                    </View>
                </View>

                {/* Amount Selection */}
                <View style={styles.selectionSection}>
                    <Text style={styles.maxLimitLabel}>
                        MAX LIMIT ({maxLimit} {currency})
                    </Text>

                    <View style={styles.amountOptions}>
                        {AMOUNTS.map((amount) => (
                            <TouchableOpacity
                                key={amount}
                                style={[
                                    styles.amountOption,
                                    selectedAmount === amount && styles.amountOptionSelected,
                                ]}
                                onPress={() => setSelectedAmount(amount)}
                            >
                                <Text style={[
                                    styles.amountOptionText,
                                    selectedAmount === amount && styles.amountOptionTextSelected,
                                ]}>
                                    {currency} {amount}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Redeem Button */}
                <TouchableOpacity style={styles.redeemButton} activeOpacity={0.8}>
                    <Ionicons name="flash" size={20} color="#FFFFFF" style={styles.redeemIcon} />
                    <Text style={styles.redeemButtonText}>REDEEM</Text>
                </TouchableOpacity>

                {/* T&C */}
                <TouchableOpacity style={styles.tcButton}>
                    <Ionicons name="information-circle-outline" size={18} color="#999999" />
                    <Text style={styles.tcButtonText}>View T&C</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoX: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
    },
    logoCard: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
        color: '#000000',
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    mainCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 40,
        padding: 30,
        alignItems: 'center',
        marginTop: 40,
        position: 'relative',
    },
    inStoreBadge: {
        position: 'absolute',
        top: 30,
        left: 30,
        fontSize: 14,
        color: '#999999',
        fontFamily: Typography.metropolis.medium,
    },
    logoWrapper: {
        marginTop: -70, // Offset to make logo pop out
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    brandLogoContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandLogo: {
        width: '100%',
        height: '100%',
    },
    brandLogoPlaceholder: {
        fontSize: 40,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFFFFF',
    },
    brandName: {
        fontSize: 18,
        fontFamily: Typography.metropolis.medium,
        color: '#000000',
        marginTop: 16,
    },
    generateGiftCardWrapper: {
        alignItems: 'center',
        marginTop: 12,
    },
    generateText: {
        fontSize: 28,
        fontFamily: Typography.integral.bold,
        color: '#000000',
        lineHeight: 32,
    },
    giftCardText: {
        fontSize: 28,
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
        lineHeight: 32,
    },
    selectedAmountContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        marginTop: 30,
        width: '100%',
        alignItems: 'center',
    },
    selectedAmountText: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
        color: '#000000',
    },
    selectionSection: {
        marginTop: 30,
    },
    maxLimitLabel: {
        fontSize: 12,
        color: '#999999',
        fontFamily: Typography.metropolis.medium,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 4,
    },
    amountOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    amountOption: {
        flex: 1,
        height: 56,
        backgroundColor: '#F8F9FA',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    amountOptionSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    amountOptionText: {
        fontSize: 15,
        fontFamily: Typography.integral.bold,
        color: '#666666',
    },
    amountOptionTextSelected: {
        color: '#000000',
    },
    redeemButton: {
        backgroundColor: Colors.brandGreen,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    redeemIcon: {
        marginRight: 10,
    },
    redeemButtonText: {
        fontSize: 18,
        fontFamily: Typography.integral.bold,
        color: '#FFFFFF',
    },
    tcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 10,
    },
    tcButtonText: {
        fontSize: 13,
        fontFamily: Typography.metropolis.medium,
        color: '#999999',
        marginLeft: 6,
    },
});
