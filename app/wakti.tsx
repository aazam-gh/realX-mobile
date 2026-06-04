import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    I18nManager,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { triggerSubtleHaptic } from '../utils/haptics';
import { logger } from '../utils/logger';

const WAKTI_IOS_URL = 'https://apps.apple.com/us/app/wakti-ai/id6755150700';
const WAKTI_ANDROID_URL = 'https://play.google.com/store/apps/details?id=ai.wakti.app';
const waktiBannerImage = require('../assets/images/waktilogo.png');

export default function WaktiModal() {
    const isRTL = I18nManager.isRTL;
    const { t } = useTranslation();

    const dismissModal = () => {
        triggerSubtleHaptic();
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace('/(tabs)');
    };

    const handleStorePress = async () => {
        const storeUrl = Platform.OS === 'android' ? WAKTI_ANDROID_URL : WAKTI_IOS_URL;

        triggerSubtleHaptic();

        try {
            await Linking.openURL(storeUrl);
            if (router.canGoBack()) {
                router.back();
            }
        } catch (error) {
            logger.error('Error opening Wakti store URL:', error);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.contentContainer}
                contentInsetAdjustmentBehavior="automatic"
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.headerRow, isRTL && styles.headerRowRTL]}>
                    <Pressable
                        onPress={dismissModal}
                        style={styles.closeButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('cancel')}
                    >
                        <Ionicons name="close" size={22} color="#FFFFFF" />
                    </Pressable>
                </View>

                <View style={styles.heroCard}>
                    <View style={[styles.heroTopRow, isRTL && styles.heroTopRowRTL]}>
                        <View style={styles.heroCopy}>
                            <Text style={[styles.heroHeadline, isRTL && styles.textRTL]} numberOfLines={4}>
                                {t('wakti_banner_headline')}
                            </Text>
                            <Text style={[styles.heroOffer, isRTL && styles.textRTL]}>
                                {t('wakti_banner_offer')}
                            </Text>
                            <Text style={[styles.heroBody, isRTL && styles.textRTL]}>
                                {t('wakti_banner_body')}
                            </Text>
                        </View>

                        <View style={styles.heroArtPanel}>
                            <Image
                                source={waktiBannerImage}
                                style={styles.heroArtImage}
                                contentFit="contain"
                                accessibilityLabel="Wakti AI logo"
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.details}>
                    <Text style={[styles.title, isRTL && styles.textRTL]}>
                        {t('wakti_sheet_title')}
                    </Text>
                    <Text style={[styles.body, isRTL && styles.textRTL]}>
                        {t('wakti_sheet_body')}
                    </Text>

                    <View style={styles.detailList}>
                        <Text style={[styles.detailItem, isRTL && styles.textRTL]}>
                            {t('wakti_sheet_detail_planning')}
                        </Text>
                        <Text style={[styles.detailItem, isRTL && styles.textRTL]}>
                            {t('wakti_sheet_detail_learning')}
                        </Text>
                        <Text style={[styles.detailItem, isRTL && styles.textRTL]}>
                            {t('wakti_sheet_detail_tasks')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleStorePress}
                        style={styles.cta}
                        accessibilityRole="link"
                        accessibilityLabel={t('wakti_sheet_cta')}
                    >
                        <Ionicons name="download-outline" size={19} color="#FFFFFF" />
                        <Text style={styles.ctaText}>
                            {t('wakti_sheet_cta')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scroll: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 34,
        gap: 18,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    headerRowRTL: {
        flexDirection: 'row-reverse',
    },
    closeButton: {
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 21,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    heroCard: {
        overflow: 'hidden',
        minHeight: 238,
        justifyContent: 'space-between',
        gap: 18,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: Colors.brandGreen,
        backgroundColor: '#000000',
        paddingVertical: 24,
        paddingHorizontal: 20,
        boxShadow: '0 18px 38px rgba(4, 15, 18, 0.26)',
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    heroTopRowRTL: {
        flexDirection: 'row-reverse',
    },
    heroCopy: {
        flex: 1,
        minWidth: 0,
        gap: 12,
    },
    heroHeadline: {
        color: Colors.brandGreen,
        fontSize: 26,
        lineHeight: 36,
        fontFamily: Typography.hanson.bold,
    },
    heroOffer: {
        color: Colors.brandGreen,
        fontSize: 38,
        lineHeight: 42,
        fontFamily: Typography.hanson.bold,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(24, 184, 82, 0.24)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 12,
    },
    heroBody: {
        color: 'rgba(255, 255, 255, 0.82)',
        fontSize: 14,
        lineHeight: 21,
        fontFamily: Typography.poppins.medium,
    },
    heroArtPanel: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#062912',
        borderWidth: 1,
        borderColor: 'rgba(24, 184, 82, 0.44)',
        borderRadius: 24,
        flexShrink: 0,
    },
    heroArtImage: {
        width: 96,
        height: 96,
    },
    details: {
        gap: 14,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 23,
        lineHeight: 29,
        fontFamily: Typography.hanson.bold,
    },
    body: {
        color: 'rgba(255, 255, 255, 0.74)',
        fontSize: 14,
        lineHeight: 21,
        fontFamily: Typography.poppins.medium,
    },
    detailList: {
        gap: 10,
    },
    detailItem: {
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(24, 184, 82, 0.22)',
        backgroundColor: 'rgba(24, 184, 82, 0.10)',
        paddingVertical: 12,
        paddingHorizontal: 14,
        color: 'rgba(255, 255, 255, 0.88)',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: Typography.poppins.medium,
    },
    cta: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 18,
        backgroundColor: Colors.brandGreen,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginTop: 2,
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: Typography.hanson.bold,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.28)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
    },
    textRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
