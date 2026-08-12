import Ionicons from '@expo/vector-icons/Ionicons';
import { getAuth } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { logger } from '../../utils/logger';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';
import RewardSuccessScreen from '../../components/rewards/RewardSuccessScreen';
import TransactionLoadingOverlay from '../../components/TransactionLoadingOverlay';
import GiftCardFlowScaffold from '../../components/wallet/GiftCardFlowScaffold';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { Typography } from '../../constants/Typography';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { normalizeDigits } from '../../utils/numbers';
import { showLocalNotification } from '../../utils/notifications';
import { fetchVendor } from '../../utils/firebaseQueries';
import { queryKeys } from '../../utils/queryClient';

interface RedemptionResult {
    discountAmount: number;
    savedAmount?: number;
    cashbackAmount: number;
    transactionId?: string;
    redeemedAt?: unknown;
    creatorName?: string;
    totalAmount: number;
    finalAmount: number;
}

const normalizeRedeemedAt = (value: unknown): Date | null => {
    const fromMilliseconds = (milliseconds: number) => {
        const date = new Date(milliseconds);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
        return fromMilliseconds(value < 1000000000000 ? value * 1000 : value);
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (!trimmedValue) return null;

        const numericValue = Number(trimmedValue);
        if (Number.isFinite(numericValue)) {
            return fromMilliseconds(numericValue < 1000000000000 ? numericValue * 1000 : numericValue);
        }

        return fromMilliseconds(Date.parse(trimmedValue));
    }

    if (value && typeof value === 'object') {
        const maybeTimestamp = value as {
            toDate?: () => Date;
            _seconds?: number;
            _nanoseconds?: number;
            seconds?: number;
            nanoseconds?: number;
        };

        if (typeof maybeTimestamp.toDate === 'function') {
            return normalizeRedeemedAt(maybeTimestamp.toDate());
        }

        const seconds = maybeTimestamp.seconds ?? maybeTimestamp._seconds;
        const nanoseconds = maybeTimestamp.nanoseconds ?? maybeTimestamp._nanoseconds ?? 0;
        if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
            return fromMilliseconds((seconds * 1000) + (nanoseconds / 1000000));
        }
    }

    return null;
};

// Types for better type safety
interface VendorData {
    profilePicture?: string;
    name?: string;
    nameAr?: string;
    vendorType?: 'in_store' | 'online';
    xcard?: boolean;
    pin?: string;
    [key: string]: any;
}

interface OfferData {
    discountValue?: string | number;
    discountType?: string;
    vendorId?: string;
    titleEn?: string;
    titleAr?: string;
    [key: string]: any;
}

interface OnlineVendorOffer {
    fulfillmentMode: 'coupon' | 'outbound_link' | 'partner_managed';
    discountCode?: string;
    ctaLabel?: string;
    ctaLabelAr?: string;
    instructions?: string;
    instructionsAr?: string;
}

export default function RedeemScreen() {
    const { id, vendorId, offerIndex: offerIndexParam } = useLocalSearchParams<{
        id: string;
        vendorId: string;
        offerIndex: string;
    }>();
    const router = useRouter();
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isAuthenticated, loading: authAccessLoading, requireAuth } = useAuthAccess();
    const { locale } = useAppLocale();
    const isArabic = locale === 'ar';
    const [vendor, setVendor] = useState<VendorData | null>(null);
    const [offer, setOffer] = useState<OfferData | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);
    const [onlineLoading, setOnlineLoading] = useState(false);
    const [onlineError, setOnlineError] = useState('');
    const [copied, setCopied] = useState(false);

    // Step: 'creator' only shown for xcard vendors, otherwise start at 'pin'
    const [step, setStep] = useState<'creator' | 'pin'>('pin');
    const [creatorCode, setCreatorCode] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');

    const creatorInputRef = useRef<TextInput>(null);
    const pinInputRef = useRef<TextInput>(null);
    const amountInputRef = useRef<TextInput>(null);
    const currentVendorId = vendorId || id || '';

    useEffect(() => {
        if (authAccessLoading || isAuthenticated) return;

        requireAuth('guest_redeem_message');
        router.replace('/(tabs)' as any);
    }, [authAccessLoading, isAuthenticated, requireAuth, router]);

    const {
        data: vendorResult,
        error: vendorError,
        isLoading,
    } = useQuery({
        queryKey: queryKeys.vendor(currentVendorId),
        queryFn: () => fetchVendor(currentVendorId),
        enabled: currentVendorId.length > 0,
    });

    useEffect(() => {
        if (vendorError) logger.error("Error fetching data:", vendorError);
    }, [vendorError]);

    useEffect(() => {
        if (!vendorResult) {
            setVendor(null);
            setOffer(null);
            return;
        }

        const vendorData = vendorResult.data as VendorData;
        setVendor(vendorData);
        if (vendorData.vendorType === 'online') {
            setOffer(null);
        } else {
            const offerIdx = offerIndexParam != null ? parseInt(offerIndexParam, 10) : 0;
            const vendorOffers = vendorData.offers || [];
            setOffer(vendorOffers[offerIdx] ? vendorOffers[offerIdx] as OfferData : null);
        }
        setStep(vendorData.xcard === true ? 'creator' : 'pin');
    }, [offerIndexParam, vendorResult]);

    const {
        data: onlineOffer,
        error: onlineOfferError,
        isFetching: onlineOfferLoading,
        refetch: refetchOnlineOffer,
    } = useQuery({
        queryKey: queryKeys.onlineVendorOffer(currentVendorId),
        queryFn: async () => {
            const functions = getFunctions(undefined, 'me-central1');
            const getOnlineVendorOffer = httpsCallable(functions, 'getOnlineVendorOffer');
            const offerResult = await getOnlineVendorOffer({ vendorId: currentVendorId });
            return offerResult.data as OnlineVendorOffer;
        },
        enabled: isAuthenticated && currentVendorId.length > 0 && vendor?.vendorType === 'online',
    });

    useEffect(() => {
        if (onlineOffer) {
            setOnlineError('');
        }
    }, [onlineOffer]);

    useEffect(() => {
        if (onlineOfferError) {
            logger.error('Online vendor offer error:', onlineOfferError);
            setOnlineError((onlineOfferError as any).message || t('online_store_access_failed_message'));
        }
    }, [onlineOfferError, t]);

    // Discount calculation
    const totalAmount = parseFloat(normalizeDigits(amount)) || 0;
    const discountValue = Number(offer?.discountValue) || 0;
    const discountType = offer?.discountType || 'percentage';
    const parsedDiscountPercent = Number(offer?.discountValue);
    const isPercentageDiscountOffer = offer?.discountType === 'percentage' && Number.isFinite(parsedDiscountPercent) && parsedDiscountPercent > 0;
    const roundedDiscountPercent = isPercentageDiscountOffer ? Math.round(parsedDiscountPercent) : 0;

    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = totalAmount * (discountValue / 100);
    } else if (discountType === 'buy1get1') {
        discountAmount = 0; // No discount deducted — user pays full amount
    } else {
        discountAmount = Math.min(discountValue, totalAmount);
    }
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    const canRedeem = pin.length === 4 && totalAmount > 0;

    const isOnlineVendor = vendor?.vendorType === 'online';

    const handleRedeem = async () => {
        if (!canRedeem) return;

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            requireAuth('guest_redeem_message');
            return;
        }

        setIsRedeeming(true);
        try {
            const functions = getFunctions(undefined, 'me-central1');
            const redeemOffer = httpsCallable(functions, 'redeemOffer');

            const result = await redeemOffer({
                offerIndex: offerIndexParam != null ? parseInt(offerIndexParam, 10) : 0,
                vendorId: vendorId || id,
                totalAmount,
                pin: normalizeDigits(pin),
                creatorCode: creatorCode ? normalizeDigits(creatorCode).trim() : undefined,
            });

            const data = result.data as any;

            const currency = t('currency_qar');
            const savedAmount = (data.savedAmount ?? data.discountAmount ?? discountAmount).toFixed(2);
            let message = t('you_saved_success_message', { currency, amount: savedAmount });

            if (data.cashbackAmount > 0) {
                message += `\n${t('cashback_earned_success_message', { currency, amount: data.cashbackAmount.toFixed(2) })}`;
            }

            // Show local notification for the redemption
            await showLocalNotification(
                t('redemption_successful_title'),
                message,
                { type: 'redemption_success', transactionId: data.transactionId },
                'reelx_redemptions'
            );

            // Delay success screen so notification banner is visible
            setTimeout(() => {
                setIsRedeeming(false);
                setRedemptionResult({
                    discountAmount: data.discountAmount || discountAmount,
                    transactionId: data.transactionId,
                    redeemedAt: data.redeemedAt ?? Date.now(),
                    savedAmount: data.savedAmount ?? data.discountAmount ?? discountAmount,
                    cashbackAmount: data.cashbackAmount || 0,
                    creatorName: data.creatorName,
                    totalAmount,
                    finalAmount: data.finalAmount || finalAmount,
                });
            }, 1500);
        } catch (error: any) {
            logger.error('Offer redemption error:', error);
            Alert.alert(
                t('redemption_failed_title'),
                error.message || t('redemption_failed_message')
            );
            setIsRedeeming(false);
        }
    };

    const handleCopyOnlineCode = async () => {
        if (!onlineOffer?.discountCode) return;
        triggerSubtleHaptic();
        await Clipboard.setStringAsync(onlineOffer.discountCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    const handleOnlineStoreVisit = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            requireAuth('guest_redeem_message');
            return;
        }

        const currentVendorId = vendorId || id;
        if (!currentVendorId) return;

        setOnlineLoading(true);
        try {
            const functions = getFunctions(undefined, 'me-central1');
            const recordOutboundClick = httpsCallable(functions, 'recordOnlineVendorOutboundClick');
            const requestId = `online-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
            const result = await recordOutboundClick({
                vendorId: currentVendorId,
                requestId,
                platform: Platform.OS === 'ios' ? 'ios' : 'android',
            });

            const data = result.data as { purchaseUrl?: string; tracked: boolean };
            if (data.purchaseUrl) {
                await Linking.openURL(data.purchaseUrl);
            } else {
                throw new Error(t('online_store_access_failed_message'));
            }
        } catch (error: any) {
            logger.error('Online store visit error:', error);
            Alert.alert(
                t('online_store_access_failed_title'),
                error.message || t('online_store_access_failed_message')
            );
        } finally {
            setOnlineLoading(false);
        }
    };

    const handleAction = () => {
        triggerSubtleHaptic();
        if (step === 'creator') {
            const code = normalizeDigits(creatorCode).trim().toUpperCase();
            if (code && !/^[A-Z]{2}[0-9]{2}$/.test(code)) {
                Alert.alert(t('hold_on'), t('invalid_creator_code_format'));
                return;
            }
            setStep('pin');
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 300);
        } else {
            Keyboard.dismiss();

            const normalizedPin = normalizeDigits(pin);
            const normalizedAmount = normalizeDigits(amount);

            if (normalizedPin.length !== 4) {
                Alert.alert(t('hold_on'), t('enter_4_digit_pin'));
                return;
            }
            if (!normalizedAmount || isNaN(Number(normalizedAmount)) || Number(normalizedAmount) <= 0) {
                Alert.alert(t('hold_on'), t('enter_valid_amount'));
                return;
            }

            handleRedeem();
        }
    };

    if (authAccessLoading || !isAuthenticated) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brand} />
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brand} />
            </View>
        );
    }

    if (!vendor || (!offer && !isOnlineVendor)) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.mutedText }]}>{t('redemption_info_not_found')}</Text>
                <TouchableOpacity
                    onPress={() => {
                        triggerSubtleHaptic();
                        router.back();
                    }}
                >
                    <Text style={[styles.backLink, { color: theme.brandText }]}>{t('go_back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isOnlineVendor) {
        const vendorName = isArabic ? (vendor.nameAr || vendor.name) : vendor.name;
        const isCouponOnlineOffer = (onlineOffer?.fulfillmentMode ?? 'coupon') === 'coupon';
        const onlineCtaLabel = (isArabic ? onlineOffer?.ctaLabelAr : onlineOffer?.ctaLabel)
            || onlineOffer?.ctaLabel
            || t('online_visit_store_caps');
        const onlineInstructions = (isArabic ? onlineOffer?.instructionsAr : onlineOffer?.instructions)
            || onlineOffer?.instructions
            || (isCouponOnlineOffer ? undefined : t('online_partner_managed_default_instruction'));

        return (
            <GiftCardFlowScaffold
                title={t(isCouponOnlineOffer ? 'online_vendor_title' : 'online_vendor_access_title')}
                step={2}
                totalSteps={2}
                onBack={() => router.back()}
                onClose={() => router.back()}
                contentContainerStyle={styles.onlineScrollContent}
                footer={(
                    <TouchableOpacity
                        style={[
                            styles.redeemButton,
                            { backgroundColor: theme.actionSolid },
                            { flexDirection: isArabic ? 'row-reverse' : 'row' },
                            !onlineOffer && styles.redeemButtonDisabled,
                        ]}
                        activeOpacity={0.9}
                        onPress={handleOnlineStoreVisit}
                        disabled={!onlineOffer || onlineLoading}
                        accessibilityRole="button"
                        accessibilityLabel={t('online_visit_store_caps')}
                    >
                        {onlineLoading ? (
                            <ActivityIndicator size="small" color={theme.onActionSolid} />
                        ) : (
                            <>
                                <Ionicons name="open-outline" size={20} color={theme.onActionSolid} />
                                <AppText style={[styles.redeemButtonText, { color: theme.onActionSolid }]}>
                                    {onlineCtaLabel}
                                </AppText>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            >
                <View style={styles.offerCardWrapper}>
                    <View style={[styles.onlineCard, { backgroundColor: theme.cardMuted }]}>
                        <Ionicons name="globe-outline" size={30} color={theme.brand} />
                        <Text style={[styles.onlineKicker, { color: theme.brandText, textAlign: isArabic ? 'right' : 'left' }]}>
                            {t('online_vendor_label')}
                        </Text>
                        <AppText style={[styles.onlineTitle, { color: theme.text, writingDirection: isArabic ? 'rtl' : 'ltr' }]}>
                            {vendorName || t('unknown_vendor')}
                        </AppText>
                    </View>

                    <View style={[styles.logoContainer, { backgroundColor: theme.logoTile, borderColor: theme.logoTile }]}>
                        {vendor.profilePicture ? (
                            <Image source={{ uri: vendor.profilePicture }} style={styles.logoImage} contentFit="cover" />
                        ) : (
                            <Ionicons name="globe-outline" size={42} color={theme.logoTileText} />
                        )}
                    </View>
                </View>

                {isCouponOnlineOffer ? <View style={[styles.onlineRedemptionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.text, textAlign: isArabic ? 'right' : 'left' }]}>
                        {t('online_discount_code_label')}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.onlineCodeBox,
                            { backgroundColor: theme.brandSoft, borderColor: theme.brand, flexDirection: isArabic ? 'row-reverse' : 'row' },
                        ]}
                        activeOpacity={0.85}
                        onPress={handleCopyOnlineCode}
                        disabled={!onlineOffer?.discountCode}
                        accessibilityRole="button"
                        accessibilityLabel={onlineOffer?.discountCode ? t('online_copy_hint') : t('loading')}
                    >
                        {onlineOfferLoading ? (
                            <ActivityIndicator size="small" color={theme.brand} />
                        ) : (
                            <Text style={[styles.onlineCodeText, { color: theme.brandText }]}>
                                {onlineOffer?.discountCode || '----'}
                            </Text>
                        )}
                        <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={24} color={theme.brand} />
                    </TouchableOpacity>

                    <Text style={[styles.onlineHint, { color: onlineError ? theme.danger : theme.mutedText, textAlign: isArabic ? 'right' : 'left' }]}>
                        {onlineError || (copied ? t('online_code_copied') : t('online_copy_hint'))}
                    </Text>
                    {onlineError ? (
                        <TouchableOpacity
                            onPress={() => void refetchOnlineOffer()}
                            disabled={onlineOfferLoading}
                            style={[styles.onlineRetryButton, isArabic && { alignSelf: 'flex-end' }]}
                            accessibilityRole="button"
                            accessibilityLabel={t('retry')}
                        >
                            <Text style={[styles.onlineRetryText, { color: theme.brandText }]}>{t('retry')}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View> : onlineInstructions ? (
                    <View style={[styles.onlineRedemptionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.onlineHint, { color: theme.mutedText, textAlign: isArabic ? 'right' : 'left', marginTop: 0 }]}>
                            {onlineInstructions}
                        </Text>
                    </View>
                ) : null}
            </GiftCardFlowScaffold>
        );
    }

    const inStoreOffer = offer;
    if (!inStoreOffer) {
        return null;
    }

    // Success Screen
    if (redemptionResult) {
        const savedStr = (redemptionResult.savedAmount ?? redemptionResult.discountAmount).toFixed(2);
        const earnedStr = redemptionResult.cashbackAmount.toFixed(2);
        const currency = t('currency_qar');
        const merchantName = isArabic
            ? (vendor?.nameAr || vendor?.name)
            : vendor?.name;
        const normalizedRedeemedAt = normalizeRedeemedAt(redemptionResult.redeemedAt);
        const redeemedOn = normalizedRedeemedAt
            ? normalizedRedeemedAt.toLocaleString(isArabic ? 'ar-QA' : 'en-QA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            })
            : null;
        const discountBadgeText =
            inStoreOffer.discountType === 'buy1get1'
                ? t('buy1get1_label')
                : inStoreOffer.discountType === 'percentage'
                    ? `${t('flat_off_prefix')}${roundedDiscountPercent}%${t('flat_off_suffix')}`
                    : `${currency} ${Number(inStoreOffer.discountValue || 0).toFixed(0)}${t('flat_off_suffix')}`;
        const receiptSavedLine = t('reward_success_you_saved_label');
        const receiptPayLabel = t('amount_to_pay_label');
        const pointsLine = t('reward_success_xpoints_earned_label');
        const receiptRows = [
            {
                icon: 'heart-outline' as const,
                iconBorderColor: '#D1F4DA',
                label: receiptSavedLine,
                value: `${currency} ${savedStr}`,
                tone: 'savings' as const,
                accessibilityLabel: `${receiptSavedLine} ${currency} ${savedStr}`,
            },
            {
                icon: 'card-outline' as const,
                iconBorderColor: '#DCE4EC',
                label: receiptPayLabel,
                value: `${currency} ${redemptionResult.finalAmount.toFixed(2)}`,
            },
            ...(redemptionResult.cashbackAmount > 0 ? [{
                icon: 'wallet-outline' as const,
                iconBorderColor: '#FFE7C7',
                label: pointsLine,
                value: `${currency} ${earnedStr}`,
                tone: 'points' as const,
            }] : []),
        ];
        const metaLines = [
            redeemedOn ? t('redeemed_on', { date: redeemedOn }) : null,
            redemptionResult.creatorName ? t('thanks_to_creator', { creator: redemptionResult.creatorName }) : null,
        ].filter(Boolean) as string[];

        return (
            <RewardSuccessScreen
                mascotSource={require('../../assets/images/realx-mascot-run-cash-both-hands.webp')}
                badgeText={discountBadgeText}
                badgeFinalPercent={roundedDiscountPercent}
                badgeCountUpSuffix={`%${t('flat_off_suffix')}`}
                animateBadgeCountUp={isPercentageDiscountOffer}
                merchantLabel={t('reward_success_merchant_label')}
                merchantName={merchantName}
                rows={receiptRows}
                metaLines={metaLines}
                primaryActionLabel={t('done')}
                onPrimaryAction={() => router.replace('/(tabs)/rewards')}
                onClose={() => router.replace('/')}
                isRTL={isArabic}
            />
        );
    }

    const totalFlowSteps = vendor.xcard === true ? 2 : 1;
    const flowStep = vendor.xcard === true && step === 'creator' ? 1 : totalFlowSteps;
    const vendorName = isArabic ? (vendor.nameAr || vendor.name) : vendor.name;
    const discountLabel = inStoreOffer.discountType === 'buy1get1'
        ? t('buy1get1_label')
        : `${inStoreOffer.discountValue}${inStoreOffer.discountType === 'percentage' ? '%' : ''}`;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <GiftCardFlowScaffold
                title={step === 'creator' ? t('vendor_flow_creator_title') : t('vendor_flow_details_title')}
                step={flowStep}
                totalSteps={totalFlowSteps}
                onBack={() => {
                    triggerSubtleHaptic();
                    if (step === 'pin' && vendor.xcard === true) {
                        setStep('creator');
                        Keyboard.dismiss();
                    } else {
                        router.back();
                    }
                }}
                onClose={() => router.back()}
                contentContainerStyle={styles.vendorScrollContent}
            >
                {(vendor.xcard !== true || step === 'creator') && (
                    <View style={[styles.vendorSummary, { backgroundColor: theme.cardMuted }]}>
                        <View style={[styles.vendorLogo, { backgroundColor: theme.logoTile }]}>
                            {vendor.profilePicture ? (
                                <Image source={{ uri: vendor.profilePicture }} style={styles.vendorLogoImage} contentFit="cover" />
                            ) : (
                                <Text style={[styles.vendorLogoPlaceholder, { color: theme.logoTileText }]}>{(vendorName || t('unknown')).charAt(0)}</Text>
                            )}
                        </View>
                        <View style={[styles.vendorSummaryCopy, isArabic && styles.vendorSummaryCopyRTL]}>
                            <Text style={[styles.vendorSummaryKicker, { color: theme.subtleText }, isArabic && styles.textRTL]}>{t('in_store_badge')}</Text>
                            <AppText style={[styles.vendorSummaryName, { color: theme.text }, isArabic && styles.textRTL]} numberOfLines={2}>{vendorName || t('unknown_vendor')}</AppText>
                            <View style={[styles.discountBadge, { backgroundColor: theme.brandSoft }, isArabic && styles.discountBadgeRTL]}>
                                <Ionicons name="pricetag" size={15} color={theme.brandText} />
                                <Text style={[styles.discountBadgeText, { color: theme.brandText }]}>{t('flat_off_prefix')}{discountLabel}{t('flat_off_suffix')}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {step === 'creator' ? (
                    <View style={[styles.formSection, { backgroundColor: theme.cardMuted }]}>
                        <Text style={[styles.inputLabel, { color: theme.text }, isArabic && styles.textRTL]}>
                            {t('have_creator_code')} <Text style={[styles.optionalText, { color: theme.subtleText }]}>{t('optional')}</Text>
                        </Text>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={[styles.textInputContainer, { backgroundColor: theme.card }]}
                            onPress={() => {
                                triggerSubtleHaptic();
                                creatorInputRef.current?.focus();
                            }}
                        >
                            <TextInput
                                ref={creatorInputRef}
                                style={[styles.creatorInput, { color: theme.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}
                                value={creatorCode}
                                onChangeText={(text) => setCreatorCode(normalizeDigits(text).toUpperCase())}
                                placeholder={t('creator_code_placeholder')}
                                placeholderTextColor={theme.inputPlaceholder}
                                autoCapitalize="characters"
                                maxLength={4}
                                returnKeyType="next"
                                onSubmitEditing={handleAction}
                                autoCorrect={false}
                            />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formSections}>
                        <View style={[styles.formSection, { backgroundColor: theme.cardMuted }]}>
                            <Text style={[styles.inputLabel, { color: theme.text }, isArabic && styles.textRTL]}>{t('enter_vendor_pin')}</Text>
                            <TouchableOpacity
                                activeOpacity={1}
                                style={[styles.pinVisualContainer, isArabic && styles.pinVisualContainerRTL]}
                                onPress={() => {
                                    triggerSubtleHaptic();
                                    pinInputRef.current?.focus();
                                }}
                            >
                                {[0, 1, 2, 3].map((index) => (
                                    <View key={index} style={[styles.pinBox, { backgroundColor: theme.card }, pin.length === index && { borderColor: theme.brand }]}>
                                        <Text style={[styles.pinText, { color: theme.subtleText }, pin.length > index && { color: theme.text, marginTop: 0 }]}>{pin.length > index ? '●' : '*'}</Text>
                                    </View>
                                ))}
                            </TouchableOpacity>
                            <TextInput
                                ref={pinInputRef}
                                style={styles.hiddenPinInput}
                                value={pin}
                                onChangeText={(text) => {
                                    const numericText = normalizeDigits(text).replace(/[^0-9]/g, '');
                                    if (numericText.length <= 4) setPin(numericText);
                                    if (numericText.length === 4) amountInputRef.current?.focus();
                                }}
                                keyboardType="number-pad"
                                maxLength={4}
                                onSubmitEditing={() => amountInputRef.current?.focus()}
                            />
                        </View>

                        <View style={[styles.formSection, { backgroundColor: theme.cardMuted }]}>
                            <Text style={[styles.inputLabel, { color: theme.text }, isArabic && styles.textRTL]}>{t('total_bill')}</Text>
                            <View style={[styles.amountInputContainer, { backgroundColor: theme.card }, isArabic && styles.amountInputContainerRTL]}>
                                <Text style={[styles.currencyPrefix, { color: theme.mutedText }, isArabic && styles.currencyPrefixRTL]}>{t('currency_qar')}</Text>
                                <TextInput
                                    ref={amountInputRef}
                                    style={[styles.amountInput, { color: theme.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}
                                    value={amount}
                                    onChangeText={(text) => {
                                        const filtered = normalizeDigits(text).replace(/[^0-9.]/g, '');
                                        const parts = filtered.split('.');
                                        setAmount(parts[0].slice(0, 4) + (parts.length > 1 ? `.${parts.slice(1).join('')}` : ''));
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                    placeholderTextColor={theme.inputPlaceholder}
                                    onSubmitEditing={handleAction}
                                />
                            </View>
                            {totalAmount > 0 && (
                                <View style={[styles.breakdownContainer, { backgroundColor: theme.card }]}>
                                    <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                        <Text style={[styles.breakdownLabel, { color: theme.mutedText }, isArabic && styles.textRTL]}>{t('total_bill')}</Text>
                                        <Text style={[styles.breakdownValue, { color: theme.mutedText }]}>{t('amount_with_currency', { amount: totalAmount.toFixed(2), currency: t('currency_qar') })}</Text>
                                    </View>
                                    {inStoreOffer.discountType !== 'buy1get1' && (
                                        <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                            <Text style={[styles.breakdownLabelGreen, { color: theme.brandText }, isArabic && styles.textRTL]}>{t('saved_amount_label')}</Text>
                                            <Text style={[styles.breakdownValueGreen, { color: theme.brandText }]}>{t('amount_with_currency_negative', { amount: discountAmount.toFixed(2), currency: t('currency_qar') })}</Text>
                                        </View>
                                    )}
                                    <View style={[styles.breakdownDivider, { backgroundColor: theme.border }]} />
                                    <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                        <Text style={[styles.breakdownLabelBold, { color: theme.text }, isArabic && styles.textRTL]}>{t('amount_to_pay_label')}</Text>
                                        <AppText style={[styles.breakdownValueBold, { color: theme.text }]}>{t('amount_with_currency', { amount: finalAmount.toFixed(2), currency: t('currency_qar') })}</AppText>
                                    </View>
                                    {vendor.xcard === true && (
                                        <View style={[styles.breakdownRow, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
                                            <Text style={[styles.cashbackLabel, isArabic && styles.textRTL]}>{`${t('xcard_cashback_label')} (1%)`}</Text>
                                            <Text style={styles.cashbackValue}>{t('amount_with_currency_positive', { amount: (finalAmount * 0.01).toFixed(2), currency: t('currency_qar') })}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.redeemButton, { backgroundColor: theme.actionSolid }, (step === 'pin' && !canRedeem) && styles.redeemButtonDisabled]}
                    activeOpacity={0.9}
                    onPress={handleAction}
                    disabled={(step === 'pin' && !canRedeem) || isRedeeming}
                >
                    {isRedeeming ? <ActivityIndicator size="small" color={theme.onActionSolid} /> : (
                        <>
                            <Ionicons name="flash" size={20} color={theme.onActionSolid} />
                            <AppText style={[styles.redeemButtonText, { color: theme.onActionSolid }]}>{step === 'creator' ? t('continue_caps') : t('redeem_caps')}</AppText>
                        </>
                    )}
                </TouchableOpacity>
            </GiftCardFlowScaffold>
            <TransactionLoadingOverlay visible={isRedeeming} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('body'),
        marginBottom: 10,
    },
    backLink: {
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    vendorScrollContent: {
        paddingBottom: 32,
    },
    onlineScrollContent: {
        paddingBottom: 32,
    },
    vendorSummary: {
        borderRadius: 28,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    vendorLogo: {
        width: 68,
        height: 68,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 3px 7px rgba(0,0,0,0.12)',
    },
    vendorLogoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    vendorLogoPlaceholder: {
        fontSize: 28,
        ...Typography.getTextVariantStyle('display'),
    },
    vendorSummaryCopy: {
        flex: 1,
        alignItems: 'flex-start',
        gap: 4,
    },
    vendorSummaryCopyRTL: {
        alignItems: 'flex-end',
    },
    vendorSummaryKicker: {
        fontSize: 12,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    vendorSummaryName: {
        fontSize: 20,
        lineHeight: 25,
    },
    discountBadge: {
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    discountBadgeRTL: {
        flexDirection: 'row-reverse',
    },
    discountBadgeText: {
        fontSize: 13,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    formSections: {
        gap: 14,
    },
    formSection: {
        borderRadius: 28,
        padding: 20,
    },
    textInputContainer: {
        borderRadius: 22,
        height: 60,
        paddingHorizontal: 18,
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    },
    pinVisualContainerRTL: {
        flexDirection: 'row-reverse',
    },
    amountInputContainerRTL: {
        flexDirection: 'row-reverse',
    },
    currencyPrefixRTL: {
        marginRight: 0,
        marginLeft: 10,
    },
    textRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    offerCardWrapper: {
        position: 'relative',
        width: '100%',
        marginTop: 50,
    },
    onlineCard: {
        borderRadius: 35,
        paddingTop: 70,
        paddingBottom: 36,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    onlineKicker: {
        fontSize: 13,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    onlineTitle: {
        fontSize: 30,
        textAlign: 'center',
    },
    onlineRedemptionCard: {
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        marginTop: 24,
        marginBottom: 20,
        boxShadow: '0 8px 18px rgba(0,0,0,0.06)',
    },
    onlineCodeBox: {
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        marginTop: 10,
    },
    onlineCodeText: {
        fontSize: 28,
        ...Typography.getTextVariantStyle('bodyStrong'),
        letterSpacing: 3,
    },
    onlineHint: {
        marginTop: 10,
        fontSize: 13,
        ...Typography.getTextVariantStyle('body'),
    },
    onlineRetryButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
    },
    onlineRetryText: {
        fontSize: 13,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    logoContainer: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 25,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 21,
    },
    inputLabel: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('bodyStrong'),
        marginBottom: 12,
    },
    pinVisualContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pinBox: {
        width: 65,
        height: 65,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pinText: {
        fontSize: 30,
        color: '#E0E0E0',
        ...Typography.getTextVariantStyle('body'),
        marginTop: 10,
    },
    hiddenPinInput: {
        position: 'absolute',
        opacity: 0,
        height: '100%',
        width: '100%',
        zIndex: -1,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        height: 55,
        paddingHorizontal: 20,
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    },
    currencyPrefix: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('bodyStrong'),
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    breakdownContainer: {
        marginTop: 20,
        borderRadius: 20,
        padding: 20,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    breakdownLabel: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
    },
    breakdownValue: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    breakdownLabelGreen: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
    },
    breakdownValueGreen: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    breakdownDivider: {
        height: 1,
        marginVertical: 4,
    },
    breakdownLabelBold: {
        fontSize: 16,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    breakdownValueBold: {
        fontSize: 16,
    },
    cashbackLabel: {
        fontSize: 13,
        color: '#FF9800',
        ...Typography.getTextVariantStyle('body'),
    },
    cashbackValue: {
        fontSize: 13,
        color: '#FF9800',
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    redeemButton: {
        borderRadius: 35,
        height: 65,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        margin: 12,
        boxShadow: '0 8px 12px rgba(0,0,0,0.30)',
    },
    redeemButtonDisabled: {
        opacity: 0.5,
    },
    redeemButtonText: {
        fontSize: 22,
        letterSpacing: 1,
    },
    creatorInput: {
        fontSize: 18,
        ...Typography.getTextVariantStyle('bodyStrong'),
        flex: 1,
        height: '100%',
    },
    optionalText: {
        ...Typography.getTextVariantStyle('body'),
        fontSize: 14,
    },
});
