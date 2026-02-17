import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FirebaseAuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // This screen is just a placeholder for the Firebase Auth reCAPTCHA redirect.
        // The authenticated state change will be handled by the listener in the phone screen.
        // However, we can also add a timeout to go back if it hangs.
        const timer = setTimeout(() => {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#34A853" />
            </View>
        </SafeAreaView>
    );
}
