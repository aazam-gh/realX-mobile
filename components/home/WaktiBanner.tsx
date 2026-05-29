import { Image } from 'expo-image';
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

    const handlePress = async () => {
        const storeUrl = Platform.OS === 'android' ? WAKTI_ANDROID_URL : WAKTI_IOS_URL;

        triggerSubtleHaptic();

        try {
            await Linking.openURL(storeUrl);
        } catch (error) {
            logger.error('Error opening Wakti store URL:', error);
        }
    };

    return (
        <View style={[styles.section, style]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                style={styles.card}
                accessibilityRole="link"
                accessibilityLabel="Download Wakti AI"
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
  hero: {
        overflow: 'hidden',
        backgroundColor: '#09161D',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    glowTop: {
        position: 'absolute',
        top: -72,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(28, 184, 82, 0.16)',
    },
    glowBottom: {
        position: 'absolute',
        bottom: -88,
        left: -52,
        width: 204,
        height: 204,
        borderRadius: 102,
        backgroundColor: 'rgba(44, 124, 196, 0.18)',
    },
    heroContent: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        gap: 8,
        zIndex: 2,
    },
    heroContentRTL: {
        left: 16,
        right: 16,
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
      resizeMode: "cover"
    },
    copy: {
        flex: 1,
        gap: 8,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    kicker: {
        color: Colors.brandGreen,
        fontSize: 11,
        lineHeight: 14,
        fontWeight: '900',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },
    headline: {
        color: '#FFFFFF',
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '900',
        letterSpacing: -0.7,
        maxWidth: 230,
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
    textRTL: {
        alignSelf: 'flex-end',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
