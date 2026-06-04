import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    I18nManager,
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

const waktiBannerImage = require('../../assets/images/waktilogo.png');

type WaktiBannerProps = {
    style?: StyleProp<ViewStyle>;
};

export default function WaktiBanner({ style }: WaktiBannerProps) {
    const isRTL = I18nManager.isRTL;
    const router = useRouter();
    const { t } = useTranslation();

    const handleBannerPress = () => {
        triggerSubtleHaptic();
        router.push('/wakti');
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
                        <Text style={[styles.headline, isRTL && styles.textRTL]} numberOfLines={3}>
                            {t('wakti_banner_headline')}
                        </Text>
                        <Text style={[styles.offerText, isRTL && styles.textRTL]} numberOfLines={1}>
                            {t('wakti_banner_offer')}
                        </Text>
                    </View>

                    <View style={styles.artPanel}>
                        <Image
                            source={waktiBannerImage}
                            style={styles.artImage}
                            contentFit="contain"
                            accessibilityLabel="Wakti AI logo"
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
        backgroundColor: '#000000',
        borderWidth: 1.5,
        borderColor: Colors.brandGreen,
        borderRadius: 30,
        boxShadow: '0 16px 34px rgba(4, 15, 18, 0.18)',
    },
    content: {
        minHeight: 154,
        paddingVertical: 18,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
    },
    contentRTL: {
        flexDirection: 'row-reverse',
    },
    copy: {
        flex: 1,
        minWidth: 0,
        gap: 12,
        justifyContent: 'center',
    },
    headline: {
        color: Colors.brandGreen,
        fontSize: 20,
        lineHeight: 28,
        fontFamily: Typography.hanson.bold,
    },
    offerText: {
        color: Colors.brandGreen,
        fontSize: 28,
        lineHeight: 34,
        fontFamily: Typography.hanson.bold,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(24, 184, 82, 0.24)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    artPanel: {
        width: 108,
        height: 108,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#062912',
        borderWidth: 1,
        borderColor: 'rgba(24, 184, 82, 0.44)',
        borderRadius: 22,
        flexShrink: 0,
    },
    artImage: {
        width: 88,
        height: 88,
    },
    textRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
