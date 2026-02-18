import { Ionicons } from '@expo/vector-icons';
import { fetchSignInMethodsForEmail, getAuth, sendSignInLinkToEmail, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

export default function EmailOnboarding() {
    const router = useRouter();
    const params = useLocalSearchParams<{ role?: string; mode?: string }>();
    const { role, mode } = params;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
    const [isNewUser, setIsNewUser] = useState(mode === 'signup');
    const [isLoading, setIsLoading] = useState(false);
    const [isLinkSent, setIsLinkSent] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const handleBack = () => {
        if (isLinkSent) {
            setIsLinkSent(false);
            setIsEmailSubmitted(false);
        } else if (isEmailSubmitted) {
            setIsEmailSubmitted(false);
            setPassword('');
        } else {
            router.back();
        }
    };

    const handleCheckEmail = async () => {
        const trimmedEmail = email.trim().toLowerCase();

        // TEMPORARY: Disabled for testing
        /*
        if (!trimmedEmail.endsWith('.edu.qa')) {
            Alert.alert(
                'Invalid Email',
                'Please enter a valid student email ending in .edu.qa'
            );
            return;
        }
        */

        setIsLoading(true);

        try {
            // Check if email is already in use
            const getAuthInstance = getAuth();
            const methods = await fetchSignInMethodsForEmail(getAuthInstance, trimmedEmail);
            const exists = methods.length > 0;

            setIsNewUser(!exists);

            if (!exists) {
                // For new users, we'll use email link authentication to verify their email
                const { actionCodeSettings, saveAuthEmail } = require('../utils/auth');

                await sendSignInLinkToEmail(getAuthInstance, trimmedEmail, actionCodeSettings);
                await saveAuthEmail(trimmedEmail);

                setIsLinkSent(true);
                setIsEmailSubmitted(true);
            } else {
                // For existing users, proceed to password entry
                setIsEmailSubmitted(true);
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthenticate = async () => {
        if (password.length < 6) {
            Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        const trimmedEmail = email.trim().toLowerCase();

        try {
            // This now only handles existing users signing in with password
            // or new users if we decide to keep password flow (but link is better for verification)
            await signInWithEmailAndPassword(getAuth(), trimmedEmail, password);
            console.log('User signed in!');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Error', 'That email address is already in use!');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Error', 'That email address is invalid!');
            } else if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Incorrect password. Please try again.');
            } else if (error.code === 'auth/user-not-found') {
                Alert.alert('Error', 'No user found with this email.');
            } else {
                Alert.alert('Error', error.message || 'Authentication failed.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = async () => {
        if (isLinkSent) {
            // Maybe handle manual re-send or just wait
            return;
        }

        if (mode === 'login') {
            await handleAuthenticate();
        } else if (!isEmailSubmitted) {
            await handleCheckEmail();
        } else {
            await handleAuthenticate();
        }
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
                            {isLinkSent ? (
                                <>
                                    <Text style={styles.titleLine}>
                                        <Text style={styles.greenText}>CHECK YOUR</Text>
                                    </Text>
                                    <Text style={styles.titleLine}>
                                        <Text style={styles.blackText}>EMAIL</Text>
                                    </Text>
                                </>
                            ) : (
                                !isEmailSubmitted ? (
                                    mode === 'signup' ? (
                                        <>
                                            <Text style={styles.titleLine}>
                                                <Text style={styles.greenText}>CREATE YOUR</Text>
                                            </Text>
                                            <Text style={styles.titleLine}>
                                                <Text style={styles.blackText}>{(role === 'creator' ? 'CREATOR' : 'STUDENT')} ACCOUNT</Text>
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.titleLine}>
                                            <Text style={styles.greenText}>LOGIN</Text>
                                        </Text>
                                    )
                                ) : (
                                    isNewUser ? (
                                        <>
                                            <Text style={styles.titleLine}>
                                                <Text style={styles.greenText}>CREATE</Text>
                                                <Text style={styles.blackText}> A </Text>
                                                <Text style={styles.greenText}>PASSWORD</Text>
                                            </Text>
                                            <Text style={styles.titleLine}>
                                                <Text style={styles.blackText}>FOR YOUR ACCOUNT</Text>
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.titleLine}>
                                            <Text style={styles.greenText}>WELCOME</Text>
                                            <Text style={styles.blackText}> BACK</Text>
                                        </Text>
                                    )
                                )
                            )}
                        </View>

                        <View style={styles.inputWrapper}>
                            {isLinkSent ? (
                                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                                    <Ionicons name="mail-outline" size={80} color={Colors.brandGreen} />
                                </View>
                            ) : (
                                <>
                                    {(mode === 'login' || !isEmailSubmitted) && (
                                        <View style={[styles.singleInputContainer, mode === 'login' && { marginBottom: 15 }]}>
                                            <TextInput
                                                ref={inputRef}
                                                style={styles.input}
                                                placeholder="Student Email"
                                                placeholderTextColor="#999"
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                value={email}
                                                onChangeText={setEmail}
                                                editable={!isLoading}
                                                autoFocus={mode === 'login'}
                                            />
                                        </View>
                                    )}

                                    {(mode === 'login' || (isEmailSubmitted && !isNewUser)) && (
                                        <View style={styles.singleInputContainer}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Password"
                                                placeholderTextColor="#999"
                                                secureTextEntry
                                                value={password}
                                                onChangeText={setPassword}
                                                autoFocus={mode !== 'login'}
                                                editable={!isLoading}
                                            />
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        <Text style={styles.infoText}>
                            {isLinkSent
                                ? `We've sent a magic link to ${email}. Click the link in your email to verify your account.`
                                : (mode === 'login'
                                    ? 'Enter your email and password to sign in to your account.'
                                    : (isEmailSubmitted
                                        ? (isNewUser
                                            ? 'Choose a strong password with at least 6 characters.'
                                            : 'Enter your password to sign in.')
                                        : 'Use your university email address to access exclusive student deals and discounts.'))}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={20}
                    style={styles.footer}
                >
                    <TouchableOpacity
                        style={[
                            styles.button,
                            ((!isEmailSubmitted && !email && mode !== 'login') ||
                                (mode === 'login' && (!email || password.length < 6)) ||
                                (isEmailSubmitted && password.length < 6) ||
                                isLoading) && styles.buttonDisabled
                        ]}
                        onPress={handleContinue}
                        disabled={(!isEmailSubmitted && !email && mode !== 'login') ||
                            (mode === 'login' && (!email || password.length < 6)) ||
                            (isEmailSubmitted && password.length < 6) ||
                            isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isLinkSent ? 'Resend Email' : (mode === 'login' ? 'Sign In' : (isEmailSubmitted ? (isNewUser ? 'Create Account' : 'Sign In') : 'Continue'))}
                            </Text>
                        )}
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
