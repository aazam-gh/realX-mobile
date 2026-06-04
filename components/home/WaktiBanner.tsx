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

const waktiBannerImage = require('../../assets/images/wakti-banner.png');

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

                        <View style={[styles.offerRow, isRTL && styles.offerRowRTL]}>
                            <View style={styles.mustTryWrap}>
                                <Text style={[styles.mustTry, isRTL && styles.textRTL]} numberOfLines={1}>
                                    {t('wakti_banner_must_try')}
                                </Text>
                                <View style={styles.mustTryUnderline} />
                            </View>

                            <View style={styles.discountWrap}>
                                <Text style={styles.discountNumber}>20</Text>
                                <View>
                                    <Text style={styles.discountPercent}>%</Text>
                                    <Text style={styles.discountOff}>{t('wakti_banner_discount_off')}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.artPanel}>
                        <Image
                            source={waktiBannerImage}
                            style={styles.artImage}
                            contentFit="cover"
                            contentPosition="top"
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
        gap: 14,
        justifyContent: 'center',
    },
    headline: {
        color: Colors.brandGreen,
        fontSize: 21,
        lineHeight: 29,
        fontFamily: Typography.hanson.bold,
    },
    offerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
    },
    offerRowRTL: {
        flexDirection: 'row-reverse',
    },
    mustTryWrap: {
        flex: 1,
        minWidth: 0,
        alignSelf: 'flex-end',
        gap: 3,
    },
    mustTry: {
        color: Colors.brandGreen,
        fontSize: 18,
        lineHeight: 24,
        fontFamily: Typography.hanson.bold,
        textTransform: 'uppercase',
    },
    mustTryUnderline: {
        height: 4,
        width: '92%',
        borderRadius: 999,
        backgroundColor: Colors.brandGreen,
    },
    discountWrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        flexShrink: 0,
        paddingBottom: 1,
    },
    discountNumber: {
        color: Colors.brandGreen,
        fontSize: 45,
        lineHeight: 48,
        fontFamily: Typography.hanson.bold,
        textShadowColor: 'rgba(24, 184, 82, 0.24)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    discountPercent: {
        color: Colors.brandGreen,
        fontSize: 20,
        lineHeight: 22,
        fontFamily: Typography.hanson.bold,
    },
    discountOff: {
        color: Colors.brandGreen,
        fontSize: 14,
        lineHeight: 15,
        fontFamily: Typography.hanson.bold,
    },
    artPanel: {
        width: 94,
        height: 112,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#062912',
        borderWidth: 1,
        borderColor: 'rgba(24, 184, 82, 0.44)',
        borderRadius: 22,
    },
    artImage: {
        width: 148,
        height: 148,
    },
    textRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
