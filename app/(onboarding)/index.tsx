import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import AppText from '../../components/AppText';
import {
    OnboardingButtonMotion,
    OnboardingDiscoverTransitionMotion,
    OnboardingGlowMotion,
    OnboardingPressableMotion,
    OnboardingRoleCardMotion,
} from '../../components/onboarding/OnboardingMotion';
import { OnboardingScaffold, OnboardingSecondaryButton } from '../../components/onboarding/OnboardingUI';
import StaggeredHeadingText from '../../components/onboarding/StaggeredHeadingText';
import { useAppTheme } from '../../context/AppThemeContext';
import { useAuthAccess } from '../../context/AuthAccessContext';
import { useAppLocale } from '../../context/LocaleContext';
import { Typography } from '../../constants/Typography';
import { logger } from '../../utils/logger';

const backgroundIcons: {
    name: keyof typeof Ionicons.glyphMap;
    top: number;
    left: number;
    size: number;
    rotation: string;
}[] = [
    // Food and drinks
    { name: 'fast-food-outline', top: 0.04, left: 0.07, size: 30, rotation: '-14deg' },
    { name: 'pizza-outline', top: 0.08, left: 0.80, size: 34, rotation: '18deg' },
    { name: 'cafe-outline', top: 0.14, left: 0.48, size: 26, rotation: '-8deg' },
    { name: 'ice-cream-outline', top: 0.19, left: 0.12, size: 29, rotation: '10deg' },
    { name: 'wine-outline', top: 0.22, left: 0.87, size: 30, rotation: '10deg' },
    { name: 'restaurant-outline', top: 0.28, left: 0.62, size: 30, rotation: '-12deg' },
    { name: 'beer-outline', top: 0.33, left: 0.05, size: 29, rotation: '8deg' },

    // Entertainment and activities
    { name: 'musical-notes-outline', top: 0.30, left: 0.25, size: 32, rotation: '-8deg' },
    { name: 'headset-outline', top: 0.37, left: 0.78, size: 31, rotation: '-12deg' },
    { name: 'ticket-outline', top: 0.40, left: 0.55, size: 34, rotation: '-16deg' },
    { name: 'game-controller-outline', top: 0.45, left: 0.87, size: 32, rotation: '8deg' },
    { name: 'film-outline', top: 0.48, left: 0.04, size: 30, rotation: '15deg' },
    { name: 'camera-outline', top: 0.53, left: 0.70, size: 28, rotation: '10deg' },
    { name: 'color-palette-outline', top: 0.58, left: 0.27, size: 30, rotation: '-12deg' },
    { name: 'football-outline', top: 0.62, left: 0.89, size: 29, rotation: '15deg' },
    { name: 'basketball-outline', top: 0.68, left: 0.06, size: 29, rotation: '-15deg' },
    { name: 'tennisball-outline', top: 0.72, left: 0.51, size: 28, rotation: '8deg' },
    { name: 'bicycle-outline', top: 0.77, left: 0.80, size: 32, rotation: '-10deg' },

    // Campus, deals, and everyday life
    { name: 'book-outline', top: 0.52, left: 0.13, size: 30, rotation: '-10deg' },
    { name: 'school-outline', top: 0.58, left: 0.82, size: 34, rotation: '8deg' },
    { name: 'library-outline', top: 0.65, left: 0.38, size: 32, rotation: '-6deg' },
    { name: 'laptop-outline', top: 0.69, left: 0.68, size: 30, rotation: '8deg' },
    { name: 'glasses-outline', top: 0.75, left: 0.20, size: 30, rotation: '-8deg' },
    { name: 'pricetag-outline', top: 0.80, left: 0.89, size: 29, rotation: '18deg' },
    { name: 'cash-outline', top: 0.83, left: 0.08, size: 30, rotation: '-10deg' },
    { name: 'card-outline', top: 0.86, left: 0.56, size: 29, rotation: '10deg' },
    { name: 'cart-outline', top: 0.90, left: 0.26, size: 32, rotation: '-10deg' },
    { name: 'gift-outline', top: 0.93, left: 0.72, size: 30, rotation: '8deg' },
    { name: 'bag-handle-outline', top: 0.96, left: 0.90, size: 28, rotation: '12deg' },
    { name: 'shirt-outline', top: 0.96, left: 0.03, size: 28, rotation: '-12deg' },

    // Community and discovery
    { name: 'people-outline', top: 0.10, left: 0.27, size: 30, rotation: '8deg' },
    { name: 'heart-outline', top: 0.17, left: 0.68, size: 28, rotation: '-10deg' },
    { name: 'chatbubble-outline', top: 0.25, left: 0.33, size: 29, rotation: '8deg' },
    { name: 'location-outline', top: 0.35, left: 0.17, size: 29, rotation: '-8deg' },
    { name: 'map-outline', top: 0.43, left: 0.36, size: 30, rotation: '12deg' },
    { name: 'sparkles-outline', top: 0.48, left: 0.58, size: 29, rotation: '-10deg' },
    { name: 'leaf-outline', top: 0.56, left: 0.57, size: 30, rotation: '14deg' },
    { name: 'flower-outline', top: 0.64, left: 0.19, size: 29, rotation: '-10deg' },
    { name: 'rocket-outline', top: 0.74, left: 0.41, size: 29, rotation: '-12deg' },
    { name: 'planet-outline', top: 0.87, left: 0.38, size: 32, rotation: '12deg' },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const [step, setStep] = useState(0);
    const [isDiscoverTransitioning, setIsDiscoverTransitioning] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'student' | 'creator' | null>(null);

    useFocusEffect(
        useCallback(() => {
            setSelectedRole(null);
        }, [])
    );

    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { continueAsGuest } = useAuthAccess();
    const { locale, isRTL, isChanging, changeLocale } = useAppLocale();
    const languageSliderX = useSharedValue(locale === 'ar' ? 66 : 0);
    const compactHeight = height < 820;
    const mascotWidth = Math.min(width * 1.75, 650);
    const mascotFrameHeight = Math.min(height * (compactHeight ? 0.31 : 0.33), 270);
    const mascotImageHeight = Math.min(height * 0.38, 300);

    const changeLanguage = async (lang: 'en' | 'ar') => {
        try {
            await changeLocale(lang);
        } catch (error) {
            logger.error('Language change error:', error);
            Alert.alert(t('error'), t('language_change_failed'));
        }
    };

    useEffect(() => {
        languageSliderX.value = withTiming(locale === 'ar' ? 66 : 0, {
            duration: 250,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [languageSliderX, locale]);

    const languageSliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: languageSliderX.value }],
    }));

    const completeDiscoverTransition = useCallback(() => {
        setStep(1);
        setIsDiscoverTransitioning(false);
    }, []);

    const handleGetStarted = () => {
        if (isDiscoverTransitioning) {
            return;
        }

        setIsDiscoverTransitioning(true);
    };

    const handleSelectRole = (role: 'student' | 'creator') => {
        if (selectedRole) {
            return;
        }

        setSelectedRole(role);
        setTimeout(() => {
            router.push({
                pathname: '/(onboarding)/email',
                params: { role, mode: 'signup' }
            } as any);
        }, 180);
    };

    const handleLogin = () => {
        router.push({
            pathname: '/(onboarding)/email',
            params: { mode: 'login' },
        } as any);
    };

    if (step === 1) {
        return (
            <>
                <StatusBar style="dark" />
                <OnboardingScaffold
                    title={t('onboarding_v2_role_title')}
                    subtitle={t('onboarding_v2_role_subtitle')}
                    onBack={() => setStep(0)}
                    onClose={() => setStep(0)}
                    progress={{ current: 1, total: 4 }}
                >
                <View style={styles.cardsWrapper}>
                    <OnboardingRoleCardMotion
                        delay={80}
                        dimmed={selectedRole !== null && selectedRole !== 'student'}
                        selected={selectedRole === 'student'}
                    >
                        <OnboardingPressableMotion
                            disabled={selectedRole !== null}
                            onPress={() => handleSelectRole('student')}
                            style={[styles.roleCard, { backgroundColor: theme.actionSolid }]}
                        >
                            <AppText style={[styles.roleTitle, { color: theme.onActionSolid }]}>{t('onboarding_join_as_student')}</AppText>
                            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={22} color={theme.onActionSolid} />
                        </OnboardingPressableMotion>
                    </OnboardingRoleCardMotion>

                    <OnboardingRoleCardMotion
                        delay={150}
                        dimmed={selectedRole !== null && selectedRole !== 'creator'}
                        selected={selectedRole === 'creator'}
                    >
                        <OnboardingPressableMotion
                            disabled={selectedRole !== null}
                            onPress={() => handleSelectRole('creator')}
                            style={[styles.roleCard, { backgroundColor: theme.actionSolid }]}
                        >
                            <AppText style={[styles.roleTitle, { color: theme.onActionSolid }]}>{t('onboarding_join_as_creator')}</AppText>
                            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={22} color={theme.onActionSolid} />
                        </OnboardingPressableMotion>
                    </OnboardingRoleCardMotion>
                </View>

                <OnboardingSecondaryButton label={t('onboarding_login_action')} onPress={handleLogin} />
                <OnboardingSecondaryButton label={t('continue_as_guest')} onPress={() => void continueAsGuest()} />
                </OnboardingScaffold>
            </>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            {backgroundIcons.map((icon, index) => (
                <View
                    key={`${icon.name}-${index}`}
                    pointerEvents="none"
                    style={[
                        styles.backgroundIcon,
                        {
                            top: height * icon.top,
                            left: width * icon.left,
                            transform: [{ rotate: icon.rotation }],
                        },
                    ]}
                >
                    <Ionicons name={icon.name} size={icon.size} color="#18B852" />
                </View>
            ))}

            <OnboardingDiscoverTransitionMotion
                active={isDiscoverTransitioning}
                backgroundColor={theme.background}
                onComplete={completeDiscoverTransition}
                style={styles.motionFill}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <View style={styles.topSection}>
                        <View style={[styles.headlineContainer, compactHeight && styles.headlineContainerCompact]}>
                            <StaggeredHeadingText
                                text={t('onboarding_headline_broke')}
                                textStyle={[styles.headlineBroke, isRTL && styles.arHeadline]}
                                fontHeight={isRTL ? 56 : 44}
                                delay={180}
                            />
                            <StaggeredHeadingText
                                text={t('onboarding_headline_not_anymore')}
                                textStyle={[styles.headlineNotAnymore, isRTL && styles.arHeadline]}
                                fontHeight={isRTL ? 56 : 44}
                                delay={320}
                            />
                        </View>
                        </View>

                        <View
                            style={[
                                styles.graphicContainer,
                                { width, height: mascotFrameHeight },
                                isRTL && styles.graphicContainerRTL,
                            ]}
                        >
                            <View style={isRTL ? styles.mascotFlip : undefined}>
                                <Image
                                    source={require('../../assets/images/onboarding.png')}
                                    style={{ width: mascotWidth, height: mascotImageHeight }}
                                    contentFit="contain"
                                    contentPosition="left"
                                />
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <View style={styles.languageSwitcher}>
                                <Animated.View
                                    pointerEvents="none"
                                    style={[styles.languageSlider, { backgroundColor: theme.actionSolid }, languageSliderStyle]}
                                />
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: locale === 'en', disabled: isChanging }}
                                    disabled={isChanging}
                                    onPress={() => void changeLanguage('en')}
                                    style={styles.languageOption}
                                    activeOpacity={1}
                                >
                                    <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>EN</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: locale === 'ar', disabled: isChanging }}
                                    disabled={isChanging}
                                    onPress={() => void changeLanguage('ar')}
                                    style={styles.languageOption}
                                    activeOpacity={1}
                                >
                                    <Text style={[styles.langText, styles.langTextArabic, locale === 'ar' && styles.langTextActive]}>ع</Text>
                                </TouchableOpacity>
                            </View>
                            <OnboardingButtonMotion enabled>
                                <OnboardingGlowMotion
                                    style={styles.buttonGlowWrapper}
                                    glowStyle={[styles.buttonGlow, { backgroundColor: theme.brandSoft, borderColor: theme.brandSoft }]}
                                >
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: theme.actionSolid }]}
                                        disabled={isDiscoverTransitioning}
                                        onPress={handleGetStarted}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[styles.buttonText, { color: '#FFFFFF' }, isRTL && styles.arButtonText]}>
                                            {t('onboarding_get_started')}
                                        </Text>
                                        <View
                                            style={styles.arrowCircle}
                                        >
                                            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={24} color={theme.actionSolid} />
                                        </View>
                                    </TouchableOpacity>
                                </OnboardingGlowMotion>
                            </OnboardingButtonMotion>
                            <TouchableOpacity
                                style={[styles.guestButton, { backgroundColor: theme.actionSolid, borderColor: theme.actionSolid }]}
                                onPress={() => void continueAsGuest()}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.guestButtonText, { color: '#FFFFFF' }, isRTL && styles.subtextRTL]}>
                                    {t('onboarding_continue_as_guest')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </OnboardingDiscoverTransitionMotion>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    backgroundIcon: {
        position: 'absolute',
        opacity: 0.24,
        zIndex: 0,
    },
    motionFill: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 4,
        justifyContent: 'space-between',
        zIndex: 1,
    },
    topSection: {
        width: '100%',
    },
    headlineContainer: {
        marginTop: 20,
        alignSelf: 'flex-start',
        paddingStart: 10,
        maxWidth: 250,
        transform: [{ translateY: 32 }],
    },
    headlineContainerCompact: {
        marginTop: 24,
    },
    headlineBroke: {
        ...Typography.getTextVariantStyle('display'),
        fontSize: 32,
        color: '#0A0F0C',
        lineHeight: 44,
    },
    headlineNotAnymore: {
        ...Typography.getTextVariantStyle('display'),
        fontSize: 32,
        color: '#18B852',
        lineHeight: 44,
    },
    graphicContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        marginStart: -24,
        transform: [{ translateY: 16 }],
    },
    mascotFlip: {
        transform: [{ scaleX: -1 }],
    },
    footer: {
        width: '100%',
        paddingBottom: 8,
        paddingHorizontal: 10,
    },
    guestButton: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        marginTop: 18,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    guestButtonText: {
        ...Typography.getTextVariantStyle('bodyStrong'),
        fontSize: 17,
    },
    button: {
        width: '100%',
        height: 72,
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingStart: 30,
        paddingEnd: 10,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 5,
    },
    buttonGlowWrapper: {
        position: 'relative',
    },
    buttonGlow: {
        position: 'absolute',
        top: -8,
        right: -8,
        bottom: -8,
        left: -8,
        borderRadius: 48,
        borderWidth: 1,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 18,
        elevation: 2,
    },
    buttonText: {
        ...Typography.getTextVariantStyle('display'),
        fontSize: 18,
        color: '#18B852',
    },
    arrowCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    languageSwitcher: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        alignSelf: 'center',
        padding: 4,
        borderRadius: 26,
        backgroundColor: '#F8FBF8',
        borderWidth: 1,
        borderColor: '#DCE5DE',
        position: 'relative',
        direction: 'ltr',
    },
    languageSlider: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 66,
        height: 44,
        borderRadius: 22,
    },
    languageOption: {
        width: 66,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    langText: {
        ...Typography.getTextVariantStyle('bodyStrong'),
        fontSize: 14,
        color: '#0A0F0C',
    },
    langTextActive: {
        color: '#FFFFFF',
    },
    langTextArabic: {
        ...Typography.getTextVariantStyle('displayArabicBlack'),
        fontSize: 18,
        lineHeight: 22,
    },
    cardsWrapper: {
        width: '100%',
        gap: 16,
    },
    roleCard: {
        minHeight: 64,
        borderRadius: 32,
        paddingHorizontal: 24,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    roleTitle: {
        fontSize: 17,
    },
    arHeadline: {
        ...Typography.getTextVariantStyle('displayArabicBlack'),
        fontSize: 42,
        lineHeight: 56,
        fontStyle: 'normal',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    graphicContainerRTL: {
        marginTop: 24,
    },
    subtextRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    arButtonText: {
        ...Typography.getTextVariantStyle('displayArabicBlack'),
        fontSize: 24,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
