import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    I18nManager,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../constants/Typography';
import { useAppTheme } from '../context/AppThemeContext';
import {
    defaultAppUpdatePromptState,
    fetchAppUpdatePromptState,
    openAppUpdateStore,
} from '../utils/appVersionGate';
import { logger } from '../utils/logger';

const APP_UPDATE_QUERY_KEY = ['app-update-prompt'] as const;

export default function AppUpdatePrompt() {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isRTL = I18nManager.isRTL;
    const [dismissed, setDismissed] = useState(false);
    const [openingStore, setOpeningStore] = useState(false);
    const {
        data: promptState = defaultAppUpdatePromptState,
        error,
    } = useQuery({
        queryKey: APP_UPDATE_QUERY_KEY,
        queryFn: fetchAppUpdatePromptState,
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 30,
        retry: 1,
    });

    useEffect(() => {
        if (error) {
            logger.warn('Unable to fetch app update prompt config:', error);
        }
    }, [error]);

    const visible = promptState.shouldPrompt && (!dismissed || promptState.force);

    const handleUpdatePress = async () => {
        if (openingStore) return;

        setOpeningStore(true);

        try {
            await openAppUpdateStore(promptState);
        } catch (error) {
            logger.warn('Unable to open app update store URL:', error);
        } finally {
            setOpeningStore(false);
        }
    };

    const handleRequestClose = () => {
        if (!promptState.force) {
            setDismissed(true);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            presentationStyle="overFullScreen"
            onRequestClose={handleRequestClose}
        >
            <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.iconWrap, { backgroundColor: theme.brandSoft }]}>
                        <Ionicons name="cloud-download-outline" size={28} color={theme.brand} />
                    </View>

                    <Text
                        style={[
                            styles.title,
                            { color: theme.text, textAlign: isRTL ? 'right' : 'center' },
                            isRTL && styles.textRTL,
                        ]}
                    >
                        {t('app_update_title')}
                    </Text>

                    <Text
                        style={[
                            styles.message,
                            { color: theme.mutedText, textAlign: isRTL ? 'right' : 'center' },
                            isRTL && styles.textRTL,
                        ]}
                    >
                        {promptState.force ? t('app_update_required_message') : t('app_update_available_message')}
                    </Text>

                    <View style={styles.actions}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryButton,
                                { backgroundColor: theme.actionSolid, opacity: pressed || openingStore ? 0.82 : 1 },
                            ]}
                            onPress={handleUpdatePress}
                            accessibilityRole="button"
                        >
                            {openingStore ? (
                                <ActivityIndicator size="small" color={theme.onActionSolid} />
                            ) : (
                                <>
                                    <Ionicons name="open-outline" size={18} color={theme.onActionSolid} />
                                    <Text style={[styles.primaryButtonText, { color: theme.onActionSolid }]}>
                                        {t('app_update_now')}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        {!promptState.force && (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryButton,
                                    { borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
                                ]}
                                onPress={() => setDismissed(true)}
                                accessibilityRole="button"
                            >
                                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                                    {t('app_update_later')}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.58)',
    },
    card: {
        width: '100%',
        maxWidth: 390,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 22,
        paddingVertical: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
    },
    iconWrap: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        ...Typography.getTextVariantStyle('bodyStrong'),
        fontSize: 22,
        lineHeight: 29,
        marginBottom: 10,
    },
    message: {
        ...Typography.getTextVariantStyle('body'),
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 22,
    },
    textRTL: {
        writingDirection: 'rtl',
    },
    actions: {
        width: '100%',
        gap: 10,
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 18,
    },
    primaryButtonText: {
        ...Typography.getTextVariantStyle('bodyStrong'),
        fontSize: 16,
        lineHeight: 20,
    },
    secondaryButton: {
        minHeight: 48,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    secondaryButtonText: {
        ...Typography.getTextVariantStyle('bodyStrong'),
        fontSize: 15,
        lineHeight: 19,
    },
});
