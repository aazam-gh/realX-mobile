import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

const { width } = Dimensions.get('window');

export default function EmailOnboarding() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleContinue = () => {
        // For now, just navigate to the phone screen
        router.push('/(onboarding)/phone' as any);
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header / Background Section */}
            <View style={styles.headerBackground}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.topButtons}>
                        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.replace('/')} style={styles.iconButton}>
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            {/* Main Content Card */}
            <View style={styles.cardContainer}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.card}>
                        <View style={styles.textContainer}>
                            <Text style={styles.titleLine}>
                                <Text style={styles.greenText}>LOGIN</Text>
                                <Text style={styles.blackText}> OR </Text>
                                <Text style={styles.greenText}>CREATE</Text>
                            </Text>
                            <Text style={styles.titleLine}>
                                <Text style={styles.blackText}>AN ACCOUNT</Text>
                            </Text>
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={styles.singleInputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Student Email"
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <Text style={styles.infoText}>
                            Use your university email address to access exclusive student deals and discounts.
                        </Text>
                    </View>
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={20}
                    style={styles.footer}
                >
                    <TouchableOpacity
                        style={[styles.button, !email && styles.buttonDisabled]}
                        onPress={handleContinue}
                        disabled={!email}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.brandGreen,
    },
    headerBackground: {
        height: 250,
        backgroundColor: Colors.brandGreen,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        marginTop: -80,
        paddingHorizontal: 30,
        paddingTop: 40,
    },
    card: {
        flex: 1,
    },
    textContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    titleLine: {
        fontSize: 32,
        fontFamily: Typography.integral.bold,
        textAlign: 'center',
        lineHeight: 38,
    },
    greenText: {
        color: Colors.brandGreen,
    },
    blackText: {
        color: '#000000',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    singleInputContainer: {
        backgroundColor: '#F3F3F3',
        borderRadius: 30,
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    input: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#000',
    },
    infoText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 10,
        fontFamily: Typography.metropolis.medium,
    },
    footer: {
        paddingBottom: 40,
    },
    button: {
        backgroundColor: Colors.brandGreen,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: Typography.metropolis.medium,
    },
});
