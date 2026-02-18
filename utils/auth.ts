import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_EMAIL_KEY = 'auth_email_for_sign_in';

/**
 * Configuration for the email sign-in link.
 * Note: The 'url' domain must be whitelisted in Firebase Console -> Authentication -> Settings -> Authorized domains.
 */
export const actionCodeSettings = {
    // This URL will be used as a fallback and should be whitelisted in Firebase Console.
    url: 'https://reelx-backend.firebaseapp.com',
    handleCodeInApp: true,
    iOS: {
        bundleId: 'com.reelx.app',
    },
    android: {
        packageName: 'com.reelx.app',
        installApp: true,
        minimumVersion: '1',
    },
    // Optional: if using Dynamic Links (deprecated but still supported in some configs)
    // dynamicLinkDomain: 'reelx.page.link',
};

export const saveAuthEmail = async (email: string) => {
    try {
        await AsyncStorage.setItem(AUTH_EMAIL_KEY, email);
    } catch (e) {
        console.error('Error saving auth email:', e);
    }
};

export const getAuthEmail = async () => {
    try {
        return await AsyncStorage.getItem(AUTH_EMAIL_KEY);
    } catch (e) {
        console.error('Error getting auth email:', e);
        return null;
    }
};

export const clearAuthEmail = async () => {
    try {
        await AsyncStorage.removeItem(AUTH_EMAIL_KEY);
    } catch (e) {
        console.error('Error clearing auth email:', e);
    }
};
