import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    const handleGetStarted = () => {
        // Navigate to the email onboarding screen
        router.push('/(onboarding)/email' as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <Text style={styles.title}>StudentSaver</Text>
                <Text style={styles.subtitle}>Exclusive discounts for students</Text>
            </View>

            <View style={styles.imageContainer}>
                <Image
                    source={require('../../assets/images/onboarding.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGetStarted}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.onboarding.background,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    title: {
        fontSize: 42,
        fontFamily: Typography.integral.bold,
        letterSpacing: -0.5,
        color: Colors.onboarding.title,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: Colors.onboarding.subtitle,
        fontFamily: Typography.metropolis.medium,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    image: {
        width: width * 0.85,
        height: width * 0.85,
    },
    footer: {
        width: '100%',
        paddingHorizontal: 30,
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.onboarding.primary,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.onboarding.shadow,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: Colors.onboarding.buttonText,
        fontSize: 18,
        fontFamily: Typography.metropolis.medium,
    },
});

