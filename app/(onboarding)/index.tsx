import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <View style={[styles.container, { backgroundColor: theme.brand }]}>
            <StatusBar style="light" />

            <OnboardingDiscoverTransitionMotion
                active={isDiscoverTransitioning}
                backgroundColor={theme.background}
                onComplete={completeDiscoverTransition}
                style={styles.motionFill}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <View style={styles.topSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logo}
                                contentFit="contain"
                            />
                        </View>

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
                                <TouchableOpacity disabled={isChanging} onPress={() => void changeLanguage('en')}>
                                    <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>English</Text>
                                </TouchableOpacity>
                                <Text style={styles.langSeparator}> | </Text>
                                <TouchableOpacity disabled={isChanging} onPress={() => void changeLanguage('ar')}>
                                    <Text style={[styles.langText, locale === 'ar' && styles.langTextActive]}>العربية</Text>
                                </TouchableOpacity>
                            </View>
                            <OnboardingButtonMotion enabled>
                                <OnboardingGlowMotion
                                    style={styles.buttonGlowWrapper}
                                    glowStyle={[styles.buttonGlow, { backgroundColor: theme.logoTile, borderColor: theme.logoTile }]}
                                >
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: theme.logoTile }]}
                                        disabled={isDiscoverTransitioning}
                                        onPress={handleGetStarted}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[styles.buttonText, { color: theme.brand }, isRTL && styles.arButtonText]}>
                                            {t('onboarding_get_started')}
                                        </Text>
                                        <View
                                            style={[styles.arrowCircle, { backgroundColor: theme.brand }]}
                                        >
                                            <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={24} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                </OnboardingGlowMotion>
                            </OnboardingButtonMotion>
                            <TouchableOpacity
                                style={[styles.guestButton, { backgroundColor: '#FFFFFF' }]}
                                onPress={() => void continueAsGuest()}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.guestButtonText, { color: theme.brand }, isRTL && styles.subtextRTL]}>
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
    },
    safeArea: {
        flex: 1,
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
    },
    topSection: {
        width: '100%',
    },
    logoContainer: {
        marginTop: 20,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 48,
        width: 150,
    },
    headlineContainer: {
        marginTop: 36,
        alignSelf: 'flex-start',
        paddingStart: 10,
        maxWidth: 250,
    },
    headlineContainerCompact: {
        marginTop: 24,
    },
    headlineBroke: {
        ...Typography.getTextVariantStyle('display'),
        fontSize: 32,
        color: '#FFFFFF',
        lineHeight: 44,
    },
    headlineNotAnymore: {
        ...Typography.getTextVariantStyle('display'),
        fontSize: 32,
        color: '#FFFFFF',
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
        zIndex: 2,
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
    },
    languageSwitcher: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    langText: {
        ...Typography.getTextVariantStyle('body'),
        fontSize: 20,
      color: '#FFFFFF',
      opacity: 0.75,
    },
    langTextActive: {
        opacity: 1,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    langSeparator: {
        fontSize: 16,
        color: '#FFFFFF',
        marginHorizontal: 15,
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
