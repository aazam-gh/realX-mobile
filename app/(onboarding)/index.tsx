import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push('/(onboarding)/email' as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <SafeAreaView style={styles.safeArea}>
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
    },
    logo: {
        height: 48,
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
});


