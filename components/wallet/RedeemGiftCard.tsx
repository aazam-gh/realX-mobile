import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAppLocale } from '../../context/LocaleContext';
import { Typography } from '../../constants/Typography';
import ScalePressable from '../ScalePressable';
import AppText from '../AppText';
import GiftCardFlowScaffold from './GiftCardFlowScaffold';
import GiftCardCheckout from './GiftCardCheckout';
import GiftCardTermsDrawer from './GiftCardTermsDrawer';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { useTranslation } from 'react-i18next';
import type { WalletBrand } from './types';

type RedeemGiftCardProps = {
    brand: WalletBrand;
    onBack: () => void;
    maxLimit: number;
    currency: string;
    onSuccess?: () => void;
    onClose?: () => void;
};


export default function RedeemGiftCard({
    brand,
    onBack,
    maxLimit,
    currency,
    onSuccess,
    onClose,
}: RedeemGiftCardProps) {
    const amounts = brand.loyalty && brand.loyalty.length > 0 ? brand.loyalty : [25, 50, 75];
    const { theme } = useAppTheme();
    const [selectedAmount, setSelectedAmount] = useState(amounts[0]);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const { t } = useTranslation();
    const { isRTL } = useAppLocale();

    if (showCheckout) {
        return (
            <GiftCardCheckout
                brand={brand}
                selectedAmount={selectedAmount}
                currency={currency}
                onBack={() => setShowCheckout(false)}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <GiftCardFlowScaffold
                title={t('gift_card_flow_amount_title')}
                step={2}
                totalSteps={3}
                onBack={() => {
                    triggerSubtleHaptic();
                    onBack();
                }}
                onClose={onClose}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Main Card */}
                <View style={[styles.mainCard, { backgroundColor: theme.cardMuted }]}>
                    <Text
                        style={[
                            styles.inStoreBadge,
                            { color: theme.subtleText },
                            isRTL ? styles.inStoreBadgeRTL : undefined,
                        ]}
                    >
                        {t('in_store_badge')}
                    </Text>

                    <View style={[styles.logoWrapper, { backgroundColor: theme.logoTile }]}>
                        <View style={[styles.brandLogoContainer, { backgroundColor: brand.backgroundColor || theme.logoTile }]}>
                            {brand.logo ? (
                                <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
                            ) : (
                                <Text style={[styles.brandLogoPlaceholder, { color: theme.logoTileText }]}>
                                    {brand.name.charAt(0)}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Text style={[styles.brandName, { color: theme.text }]}>{brand.name}</Text>

                    <View style={styles.generateGiftCardWrapper}>
                        <AppText style={[styles.generateText, { color: theme.text }]}>{t('generate_text')}</AppText>
                        <AppText style={[styles.giftCardText, { color: theme.brand }]}>{t('gift_card_text')}</AppText>
                    </View>

                    <View style={[styles.selectedAmountContainer, { backgroundColor: theme.card }]}>
                        <AppText style={[styles.selectedAmountText, { color: theme.text }]}>
                            {currency} {selectedAmount.toFixed(2)}
                        </AppText>
                    </View>
                </View>

                <ScalePressable
                    style={[styles.tcButton, isRTL && styles.tcButtonRTL]}
                    onPress={() => {
                        triggerSubtleHaptic();
                        setShowTerms(true);
                    }}
                    pressedScale={0.985}
                >
                    <Ionicons name="information-circle-outline" size={18} color={theme.iconMuted} />
                    <Text style={[styles.tcButtonText, { color: theme.subtleText }, isRTL && styles.tcButtonTextRTL]}>{t('view_tc')}</Text>
                </ScalePressable>

                {/* Amount Selection */}
                <View style={styles.selectionSection}>
                    {/* MAX LIMIT label removed */}

                    <View style={[styles.amountOptions, isRTL && styles.amountOptionsRTL]}>
                        {amounts.map((amount) => (
                            <ScalePressable
                                key={amount}
                                style={[
                                    styles.amountOption,
                                    {
                                        backgroundColor: selectedAmount === amount ? theme.card : theme.cardMuted,
                                        borderColor: selectedAmount === amount ? theme.border : 'transparent',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.10)',
                                    },
                                    selectedAmount === amount && styles.amountOptionSelected,
                                ]}
                                onPress={() => {
                                    triggerSubtleHaptic();
                                    setSelectedAmount(amount);
                                }}
                                pressedScale={0.94}
                            >
                                <AppText style={[
                                    styles.amountOptionText,
                                    { color: selectedAmount === amount ? theme.text : theme.mutedText },
                                ]}>
                                    {amount.toFixed(2)}
                                </AppText>
                            </ScalePressable>
                        ))}
                    </View>
                </View>

                <ScalePressable
                    style={[styles.redeemButton, { backgroundColor: theme.actionSolid }, selectedAmount > maxLimit && styles.redeemButtonDisabled]}
                    onPress={() => {
                        triggerSubtleHaptic();
                        setShowCheckout(true);
                    }}
                    disabled={selectedAmount > maxLimit}
                    pressedScale={0.975}
                >
                    <Ionicons name="flash" size={20} color={theme.onActionSolid} style={styles.redeemIcon} />
                    <AppText style={[styles.redeemButtonText, { color: theme.onActionSolid }]}>{t('gift_card_flow_continue')}</AppText>
                </ScalePressable>

                {/* Insufficient Balance Warning */}
                {selectedAmount > maxLimit && (
                    <View style={[styles.insufficientContainer, { backgroundColor: theme.cardMuted }]}>
                        <Ionicons name="alert-circle" size={18} color={theme.danger} />
                        <Text style={[styles.insufficientText, { color: theme.danger, textAlign: isRTL ? 'right' : 'left' }]}>
                            {t('insufficient_balance_warning', {
                                currency,
                                selectedAmount: selectedAmount.toFixed(2),
                                maxLimit: maxLimit.toFixed(2),
                            })}
                        </Text>
                    </View>
                )}

            </GiftCardFlowScaffold>
            <GiftCardTermsDrawer
                visible={showTerms}
                onClose={() => setShowTerms(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    mainCard: {
        borderRadius: 40,
        padding: 24,
        alignItems: 'center',
        marginTop: 24,
        position: 'relative',
    },
    inStoreBadge: {
        position: 'absolute',
        top: 24,
        left: 24,
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
    },
    inStoreBadgeRTL: {
        left: undefined,
        right: 24,
        textAlign: 'right',
    },
    logoWrapper: {
        marginTop: -52,
        padding: 10,
        borderRadius: 30,
        boxShadow: '0 4px 10px rgba(0,0,0,0.10)',
    },
    brandLogoContainer: {
        width: 84,
        height: 84,
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
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    brandName: {
        fontSize: 17,
        ...Typography.getTextVariantStyle('body'),
        marginTop: 12,
    },
    generateGiftCardWrapper: {
        alignItems: 'center',
        marginTop: 10,
    },
    generateText: {
        fontSize: 24,
        lineHeight: 28,
    },
    giftCardText: {
        fontSize: 24,
        lineHeight: 28,
    },
    selectedAmountContainer: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        marginTop: 16,
        width: '100%',
        alignItems: 'center',
    },
    selectedAmountText: {
        fontSize: 22,
    },
    selectionSection: {
        marginTop: 8,
    },
    amountOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    amountOptionsRTL: {
        flexDirection: 'row-reverse',
    },
    amountOption: {
        flex: 1,
        minWidth: 90,
        height: 56,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    amountOptionSelected: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    amountOptionText: {
        fontSize: 14,
    },
    redeemButton: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    redeemButtonDisabled: {
        opacity: 0.4,
    },
    insufficientContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        gap: 8,
    },
    insufficientText: {
        flex: 1,
        fontSize: 13,
        ...Typography.getTextVariantStyle('body'),
    },
    redeemIcon: {
        marginRight: 10,
    },
    redeemButtonText: {
        fontSize: 18,
    },
    tcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 10,
    },
    tcButtonRTL: {
        flexDirection: 'row-reverse',
    },
    tcButtonText: {
        fontSize: 13,
        ...Typography.getTextVariantStyle('body'),
        marginLeft: 6,
    },
    tcButtonTextRTL: {
        marginLeft: 0,
        marginRight: 6,
    },
});
