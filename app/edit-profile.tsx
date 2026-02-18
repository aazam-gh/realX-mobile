import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';

export default function EditProfileScreen() {
    const router = useRouter();
    const PURPLE = '#7D57FF';

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const user = auth().currentUser;
        if (!user) {
            router.replace('/(onboarding)');
            return;
        }

        const fetchUserData = async () => {
            try {
                const doc = await firestore().collection('students').doc(user.uid).get();
                if (doc.exists()) {
                    const data = doc.data();
                    setFirstName(data?.firstName || '');
                    setLastName(data?.lastName || '');
                    setPhone(data?.phone || '');
                    setEmail(data?.email || user.email || '');
                    setDob(data?.dob || '');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                Alert.alert('Error', 'Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleBack = () => {
        router.back();
    };

    const handleSave = async () => {
        const user = auth().currentUser;
        if (!user) return;

        setIsSaving(true);
        try {
            await firestore().collection('students').doc(user.uid).update({
                firstName,
                lastName,
                phone,
                dob,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });
            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Profile Image Section */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarMain}>
                            <Ionicons name="person" size={80} color="#E0E0E0" />
                        </View>
                        <TouchableOpacity style={styles.uploadButton}>
                            <Ionicons name="arrow-up" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {/* First Name Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>First Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            placeholder="Enter your first name"
                                        />
                                    </View>
                                </View>

                                {/* Last Name Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            value={lastName}
                                            onChangeText={setLastName}
                                            placeholder="Enter your last name"
                                        />
                                    </View>
                                </View>

                                {/* Phone Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Phone</Text>
                                    <View style={styles.phoneRow}>
                                        <TouchableOpacity style={styles.countrySelector}>
                                            <Image
                                                source={{ uri: 'https://flagcdn.com/w40/qa.png' }}
                                                style={styles.flag}
                                            />
                                            <Ionicons name="chevron-down" size={16} color="#999" style={styles.chevron} />
                                            <Text style={styles.countryCode}>+974</Text>
                                        </TouchableOpacity>
                                        <View style={styles.phoneInputWrapper}>
                                            <TextInput
                                                style={styles.input}
                                                value={phone}
                                                onChangeText={setPhone}
                                                keyboardType="phone-pad"
                                                placeholder="Phone number"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Email Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email</Text>
                                    <View style={[styles.inputWrapper, styles.disabledInput]}>
                                        <TextInput
                                            style={[styles.input, styles.disabledText]}
                                            value={email}
                                            editable={false}
                                            onChangeText={setEmail}
                                            placeholder="Email address"
                                        />
                                    </View>
                                </View>

                                {/* Date of Birth Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Date of Birth</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            value={dob}
                                            onChangeText={setDob}
                                            placeholder="DD/MM/YYYY"
                                        />
                                        <Ionicons name="calendar-outline" size={24} color="#000" />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                { backgroundColor: PURPLE },
                                (isLoading || isSaving) && { opacity: 0.7 }
                            ]}
                            onPress={handleSave}
                            activeOpacity={0.8}
                            disabled={isLoading || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteButton}>
                            <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 30,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
        alignSelf: 'center',
    },
    avatarMain: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadButton: {
        position: 'absolute',
        bottom: 0,
        right: 5,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#000',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 24,
        paddingHorizontal: 20,
        height: 56,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#000',
    },
    disabledInput: {
        backgroundColor: '#F3F3F3',
    },
    disabledText: {
        color: '#999',
    },
    phoneRow: {
        flexDirection: 'row',
        gap: 12,
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 24,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        gap: 8,
    },
    flag: {
        width: 24,
        height: 18,
        borderRadius: 2,
    },
    countryCode: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#999',
    },
    phoneInputWrapper: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        borderRadius: 24,
        paddingHorizontal: 20,
        height: 56,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    chevron: {
        marginRight: 2,
    },
    actions: {
        marginTop: 40,
        gap: 20,
    },
    saveButton: {
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 18,
        fontFamily: Typography.metropolis.semiBold,
        color: '#FFF',
    },
    deleteButton: {
        alignItems: 'flex-start',
    },
    deleteButtonText: {
        fontSize: 16,
        fontFamily: Typography.metropolis.medium,
        color: '#FF3B30',
    },
});
