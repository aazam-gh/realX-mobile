import { Ionicons } from '@expo/vector-icons';
import { FirebaseAuthTypes, getAuth, onAuthStateChanged, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    //Dimensions,
    Image,
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

// const { width } = Dimensions.get('window');

export default function PhoneOnboarding() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle authentication state changes
    useEffect(() => {
        const subscriber = onAuthStateChanged(getAuth(), (user) => {
            if (user) {
                console.log('User signed in:', user.uid);
                // Use replace to prevent stacking and use the standard route path
                router.replace({
                    pathname: '/details',
                    params: { email: email || '', phone: phoneNumber || user.phoneNumber || '' }
                } as any);
            }
        });
        return subscriber; // unsubscribe on unmount
    }, [email, phoneNumber, router]);

    // If we were using a reCAPTCHA verifier, we would initialize it here
    // import { RecaptchaVerifier } from 'firebase/auth';

    const handleSendCode = async () => {
        // Validate phone number: 8 digits
        const cleanNumber = phoneNumber.trim();
        if (cleanNumber.length !== 8) {
            Alert.alert('Invalid Number', 'Phone number must be exactly 8 digits.');
            return;
        }

        setLoading(true);
        try {
            // Qatar specific: +974 + 8 digit number
            const formattedNumber = `+974${cleanNumber}`;

            console.log('Sending code to:', formattedNumber);
            const confirmation = await signInWithPhoneNumber(getAuth(), formattedNumber);
            setConfirm(confirmation);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', `Failed to send code: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!confirm) return;

        setLoading(true);
        try {
            await confirm.confirm(code);
            // reset code if it fails, but onAuthStateChanged will handle success
        } catch (error: any) {
            console.error(error);
            Alert.alert('Invalid Code', 'The verification code you entered is incorrect. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleContinue = () => {
        if (!confirm) {
            handleSendCode();
        } else {
            handleVerifyCode();
        }
    };

    const handleBack = () => {
        if (confirm) {
            setConfirm(null);
            setCode('');
        } else {
            router.back();
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
                            <Text style={styles.titleLine}>
                                <Text style={styles.greenText}>LOGIN</Text>
                                <Text style={styles.blackText}> OR </Text>
                                <Text style={styles.greenText}>CREATE</Text>
                            </Text>
                            <Text style={styles.titleLine}>
                                <Text style={styles.blackText}>AN ACCOUNT</Text>
                            </Text>
                        </View>

                        {!confirm ? (

                            // Phone Input
                            <View style={styles.inputWrapper}>
                                <TouchableOpacity style={styles.countryPicker}>
                                    <Image
                                        source={{ uri: 'https://flagcdn.com/w40/qa.png' }}
                                        style={styles.flag}
                                    />
                                    <Ionicons name="chevron-down" size={18} color="#999" style={styles.chevron} />
                                </TouchableOpacity>
                                <View style={styles.phoneNumberContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mobile Number (8 digits)"
                                        placeholderTextColor="#999"
                                        keyboardType="number-pad"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        maxLength={8}
                                    />
                                </View>
                            </View>
                        ) : (

                            // OTP Input
                            <View style={styles.inputWrapper}>
                                <View style={[styles.phoneNumberContainer, { backgroundColor: '#F3F3F3' }]}>
                                    <TextInput
                                        style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
                                        placeholder="123456"
                                        placeholderTextColor="#ccc"
                                        keyboardType="number-pad"
                                        value={code}
                                        onChangeText={setCode}
                                        maxLength={6}
                                        autoFocus
                                    />
                                </View>
                            </View>
                        )}

                        <Text style={styles.infoText}>
                            {!confirm
                                ? 'We\'ll send you a one-time code via SMS to verify your number.'
                                : 'Enter the code sent to your mobile number.'}
                        </Text>
                        {!confirm && (

                            <Text style={styles.infoText}>
                                By clicking &quot;Continue&quot; you agree to our <Text style={styles.boldText}>Terms & Conditions</Text>
                            </Text>
                        )}
                    </View>
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={20}
                    style={styles.footer}
                >
                    <TouchableOpacity
                        style={[styles.button, (!phoneNumber && !confirm) || (confirm && code.length < 6) ? styles.buttonDisabled : null]}
                        onPress={handleContinue}
                        disabled={((!phoneNumber && !confirm) || (!!confirm && code.length < 6)) || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>{!confirm ? 'Continue' : 'Verify'}</Text>
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
        flexDirection: 'row',
        marginBottom: 20,
    },
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F3F3',
        borderRadius: 30,
        height: 60,
        paddingHorizontal: 15,
        marginRight: 10,
        width: 85,
    },
    flag: {
        width: 24,
        height: 18,
        borderRadius: 2,
    },
    chevron: {
        marginLeft: 5,
    },
    phoneNumberContainer: {
        flex: 1,
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
        paddingHorizontal: 20,
        fontFamily: Typography.metropolis.medium,
    },
    boldText: {
        fontFamily: Typography.metropolis.semiBold,
        color: '#777',
    },
    footer: {
        paddingBottom: 60,
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
