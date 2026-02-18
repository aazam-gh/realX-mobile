import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const [step, setStep] = useState(0);

    const handleGetStarted = () => {
        setStep(1);
    };

    const handleSelectRole = (role: 'student' | 'creator') => {
        router.push({
            pathname: '/(onboarding)/email',
            params: { role, mode: 'signup' }
        } as any);
    };

    const handleLogin = () => {
        router.push({
            pathname: '/(onboarding)/email',
            params: { mode: 'login' }
        } as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <SafeAreaView style={styles.safeArea}>
                {step === 0 ? (
                    <View style={styles.content}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logo}
                                contentFit="contain"
                            />
                        </View>

                        {/* Headline */}
                        <View style={styles.headlineContainer}>
                            <Text style={styles.headlineBroke}>BROKE?</Text>
                            <Text style={styles.headlineNotAnymore}>NOT ANYMORE.</Text>
                        </View>

                        {/* Character Graphic */}
                        <View style={styles.graphicContainer}>
                            <Image
                                source={require('../../assets/images/onboarding.png')}
                                style={styles.characterImage}
                                contentFit="contain"
                            />
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.subtext}>
                                Student-only deals + cashback that actually hits different.
                            </Text>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleGetStarted}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.buttonText}>GET STARTED</Text>
                                <View style={styles.arrowCircle}>
                                    <Ionicons name="arrow-forward" size={24} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.roleSelectionContent}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.roleLogo}
                                contentFit="contain"
                            />
                        </View>

                        {/* Role Cards */}
                        <View style={styles.cardsContainer}>
                            <TouchableOpacity
                                style={styles.roleCard}
                                activeOpacity={0.9}
                                onPress={() => handleSelectRole('student')}
                            >
                                <View style={[styles.roleImageCircle, { backgroundColor: '#18B852' }]}>
                                    <Image
                                        source={require('../../assets/images/join-student.png')}
                                        style={styles.roleImage}
                                        contentFit="contain"
                                    />
                                </View>
                                <View style={styles.roleTextContainer}>
                                    <Text style={styles.roleTitle}>JOIN AS STUDENT</Text>
                                    <Text style={styles.roleDescription}>
                                        Get exclusive discounts on 50+ brands + 1% cashback on every purchase
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={32} color="#CCCCCC" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.roleCard}
                                activeOpacity={0.9}
                                onPress={() => handleSelectRole('creator')}
                            >
                                <View style={[styles.roleImageCircle, { backgroundColor: '#000000' }]}>
                                    <Image
                                        source={require('../../assets/images/join-creator.png')}
                                        style={styles.roleImage}
                                        contentFit="contain"
                                    />
                                </View>
                                <View style={styles.roleTextContainer}>
                                    <Text style={styles.roleTitle}>JOIN AS CREATOR</Text>
                                    <Text style={styles.roleDescription}>
                                        Share your personal code and earn double cashback when others use it
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={32} color="#CCCCCC" />
                            </TouchableOpacity>
                        </View>

                        {/* Login Pill */}
                        <TouchableOpacity
                            style={styles.loginPill}
                            activeOpacity={0.8}
                            onPress={handleLogin}
                        >
                            <Text style={styles.loginText}>
                                Already have an account? <Text style={styles.loginBold}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#18B852', // Colors.brandGreen
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
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
        marginTop: 40,
        alignSelf: 'flex-start',
        paddingLeft: 10,
    },
    headlineBroke: {
        fontFamily: Typography.integral.bold,
        fontSize: 40,
        color: '#FFFFFF',
        fontStyle: 'italic',
        lineHeight: 52,
    },
    headlineNotAnymore: {
        fontFamily: Typography.integral.bold,
        fontSize: 40,
        color: '#FFFFFF',
        lineHeight: 52
    },
    graphicContainer: {
        flex: 1,
        width: width,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginLeft: -24, // Negate content padding to hit edge
        marginTop: -20,
    },
    characterImage: {
        width: width - 117,
        height: height * 0.45,
    },
    footer: {
        width: '100%',
        paddingBottom: 40,
        paddingHorizontal: 10,
    },
    subtext: {
        fontFamily: Typography.metropolis.medium,
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'left',
        width: '100%',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 72,
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 30,
        paddingRight: 10,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 5,
    },
    buttonText: {
        fontFamily: Typography.integral.bold,
        fontSize: 18,
        color: Colors.brandGreen,
    },
    arrowCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: Colors.brandGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Role selection styles
    roleSelectionContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    roleLogo: {
        height: 60,
        width: 180,
        marginBottom: 60,
    },
    cardsContainer: {
        width: '100%',
        gap: 16,
    },
    roleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 45,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    roleImageCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    roleImage: {
        width: '75%',
        height: '75%',
    },
    roleTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    roleTitle: {
        fontFamily: Typography.integral.bold,
        fontSize: 18,
        color: '#000000',
        marginBottom: 2,
    },
    roleDescription: {
        fontFamily: Typography.metropolis.medium,
        fontSize: 10,
        color: '#333333',
        lineHeight: 14,
    },
    loginPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 30,
        marginTop: 50,
    },
    loginText: {
        color: '#FFFFFF',
        fontFamily: Typography.metropolis.medium,
        fontSize: 14,
    },
    loginBold: {
        fontFamily: Typography.metropolis.semiBold,
        textDecorationLine: 'none',
    },
});



