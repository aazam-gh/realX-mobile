import { BottomSheetModal, BottomSheetView, type BottomSheetMethods } from '@expo/ui/community/bottom-sheet';
import { Image } from 'expo-image';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    I18nManager,
    Linking,
    Platform,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { triggerSubtleHaptic } from '../../utils/haptics';
import { logger } from '../../utils/logger';

const WAKTI_IOS_URL = 'https://apps.apple.com/us/app/wakti-ai/id6755150700';
const WAKTI_ANDROID_URL = 'https://play.google.com/store/apps/details?id=ai.wakti.app';
const waktiBannerImage = require('../../assets/images/wakti-banner.png');

type WaktiBannerProps = {
    style?: StyleProp<ViewStyle>;
};

export default function WaktiBanner({ style }: WaktiBannerProps) {
    const isRTL = I18nManager.isRTL;
    const { t } = useTranslation();
    const modalRef = useRef<BottomSheetMethods>(null);

    const handleBannerPress = () => {
        triggerSubtleHaptic();
        modalRef.current?.present();
    };

    const handleStorePress = async () => {
        const storeUrl = Platform.OS === 'android' ? WAKTI_ANDROID_URL : WAKTI_IOS_URL;

        triggerSubtleHaptic();

        try {
            await Linking.openURL(storeUrl);
            modalRef.current?.dismiss();
        } catch (error) {
            logger.error('Error opening Wakti store URL:', error);
        }
    };

    return (
        <View style={[styles.section, style]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleBannerPress}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={t('wakti_banner_accessibility_label')}
                accessibilityHint={t('wakti_banner_accessibility_hint')}
            >
                <View style={[styles.content, isRTL && styles.contentRTL]}>
                    <View style={styles.copy}>
                        <Text style={[styles.body, isRTL && styles.textRTL]}>
                            {t('wakti_banner_body')}
                        </Text>
                        <Text style={[styles.title, isRTL && styles.textRTL]}>
                            {t('wakti_banner_cta')}
                        </Text>
                    </View>

                    <View style={styles.artPanel}>
                        <Image
                            source={waktiBannerImage}
                            style={styles.artImage}
                            contentFit="contain"
                            accessibilityLabel="Wakti AI"
                        />
                    </View>
                </View>
            </TouchableOpacity>

            <BottomSheetModal
                ref={modalRef}
                enablePanDownToClose
                backgroundStyle={styles.sheetBackground}
            >
                <BottomSheetView style={styles.sheet}>
                    <View style={[styles.sheetHero, isRTL && styles.sheetHeroRTL]}>
                        <View style={styles.sheetArtPanel}>
                            <Image
                                source={waktiBannerImage}
                                style={styles.sheetArtImage}
                                contentFit="contain"
                                accessibilityLabel="Wakti AI"
                            />
                        </View>

                        <View style={styles.sheetCopy}>
                            <Text style={[styles.sheetTitle, isRTL && styles.sheetTextRTL]}>
                                {t('wakti_sheet_title')}
                            </Text>
                            <Text style={[styles.sheetBody, isRTL && styles.sheetTextRTL]}>
                                {t('wakti_sheet_body')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailList}>
                        <Text style={[styles.detailItem, isRTL && styles.sheetTextRTL]}>
                            {t('wakti_sheet_detail_planning')}
                        </Text>
                        <Text style={[styles.detailItem, isRTL && styles.sheetTextRTL]}>
                            {t('wakti_sheet_detail_learning')}
                        </Text>
                        <Text style={[styles.detailItem, isRTL && styles.sheetTextRTL]}>
                            {t('wakti_sheet_detail_tasks')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleStorePress}
                        style={styles.sheetCta}
                        accessibilityRole="link"
                        accessibilityLabel={t('wakti_sheet_cta')}
                    >
                        <Text style={styles.sheetCtaText}>
                            {t('wakti_sheet_cta')}
                        </Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingTop: 22,
    },
    card: {
        overflow: 'hidden',
        backgroundColor: '#061015',
        borderWidth: 1,
        borderColor: '#102638',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        boxShadow: '0 16px 34px rgba(4, 15, 18, 0.18)',
    },
    content: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        backgroundColor: '#071217',
    },
    contentRTL: {
        flexDirection: 'row-reverse',
    },
    artPanel: {
        width: 98,
        height: 98,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(125, 177, 224, 0.14)',
        borderRadius: 20,
    },
    artImage: {
        width: 128,
        height: 128,
        resizeMode: 'cover',
    },
    copy: {
        flex: 1,
        gap: 8,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    body: {
        color: 'rgba(255, 255, 255, 0.74)',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: Typography.poppins.medium,
        maxWidth: 220,
    },
    title: {
        overflow: 'hidden',
        alignSelf: 'flex-start',
        borderRadius: 999,
        backgroundColor: Colors.brandGreen,
        paddingVertical: 10,
        paddingHorizontal: 16,
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: Typography.hanson.bold,
        letterSpacing: -0.1,
        textShadowColor: 'rgba(0, 0, 0, 0.36)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
    },
    sheetBackground: {
        backgroundColor: '#071217',
    },
    sheet: {
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 30,
        gap: 18,
        backgroundColor: '#071217',
    },
    sheetHero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    sheetHeroRTL: {
        flexDirection: 'row-reverse',
    },
    sheetArtPanel: {
        width: 112,
        height: 112,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(125, 177, 224, 0.16)',
        borderRadius: 24,
    },
    sheetArtImage: {
        width: 146,
        height: 146,
        resizeMode: 'cover',
    },
    sheetCopy: {
        flex: 1,
        gap: 8,
        minWidth: 0,
    },
    sheetTitle: {
        color: '#FFFFFF',
        fontSize: 21,
        lineHeight: 27,
        fontFamily: Typography.hanson.bold,
    },
    sheetBody: {
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
        borderColor: 'rgba(125, 177, 224, 0.14)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: 12,
        paddingHorizontal: 14,
        color: 'rgba(255, 255, 255, 0.86)',
        fontSize: 13,
        lineHeight: 18,
        fontFamily: Typography.poppins.medium,
    },
    sheetCta: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        borderRadius: 18,
        backgroundColor: Colors.brandGreen,
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    sheetCtaText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 20,
        fontFamily: Typography.hanson.bold,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.28)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 8,
    },
    sheetTextRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    textRTL: {
        alignSelf: 'flex-end',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
