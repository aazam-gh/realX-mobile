import { router } from 'expo-router';
import {
    StatusBar,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WaktiSheetContent from '../components/home/WaktiSheetContent';
import { triggerSubtleHaptic } from '../utils/haptics';

export default function WaktiModal() {
    const dismissModal = () => {
        triggerSubtleHaptic();
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace('/(tabs)');
    };

    const closeAfterStoreOpen = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <WaktiSheetContent onClose={dismissModal} onStoreOpened={closeAfterStoreOpen} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
});
