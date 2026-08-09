import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import {
    ActivityIndicator,
    Linking,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useAppLocale } from '../../context/LocaleContext';
import { triggerSubtleHaptic } from '../../utils/haptics';
import {
    homeQueryOptions,
    isValidHomeFeaturedBanner,
    type HomeFeaturedBannerItem,
} from '../../utils/homeQueries';
import { logger } from '../../utils/logger';
import AppText from '../AppText';
import {
    HOME_COMPACT_BANNER_HEIGHT,
    HOME_HORIZONTAL_GUTTER,
    HOME_SECTION_TOP_SPACING,
} from './layout';

export type FeaturedBannerItem = HomeFeaturedBannerItem;

type FeaturedBannerProps = {
    item?: FeaturedBannerItem;
    style?: StyleProp<ViewStyle>;
};

export default function FeaturedBanner({ item, style }: FeaturedBannerProps) {
    const { isRTL } = useAppLocale();
    const {
        data: cmsItem = null,
        error,
        isLoading,
    } = useQuery({
        ...homeQueryOptions.featuredBanner(),
        enabled: !item,
    });

    useEffect(() => {
        if (error) logger.error('Error fetching featured banner:', error);
    }, [error]);

    const currentItem = item ?? cmsItem;
    const isCmsLoading = !item && isLoading;

    const handlePress = async () => {
        if (!currentItem?.orderUrl) {
            return;
        }

        triggerSubtleHaptic();

        try {
            const canOpen = await Linking.canOpenURL(currentItem.orderUrl);
            if (canOpen) {
                await Linking.openURL(currentItem.orderUrl);
            }
        } catch (error) {
            logger.error('Error opening featured banner URL:', error);
        }
    };

    if (isCmsLoading) {
        return (
            <View style={[style]}>
                <ActivityIndicator size="small" color={Colors.brandGreen} />
            </View>
        );
    }

    if (!currentItem || !isValidHomeFeaturedBanner(currentItem)) {
        return null;
    }

    const tileImages = currentItem.tileImageUrls.slice(0, 3);
    const title = isRTL && currentItem.titleAr ? currentItem.titleAr : currentItem.title;
    const configuredCtaText = currentItem.ctaText?.trim();
    const ctaText = configuredCtaText?.toLowerCase() === 'order'
        ? 'GET 10% OFF'
        : configuredCtaText;

    return (
        <View style={[styles.section, style]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={currentItem.altText || title}
                accessibilityHint={ctaText}
            >
                <Image
                    source={{ uri: currentItem.heroImageUrl }}
                    style={styles.heroImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    accessibilityLabel={currentItem.altText || title}
                />
                <View style={styles.overlay} />

                <View style={[styles.content, isRTL && styles.contentRTL]}>
                    <View style={styles.copy}>
                        <AppText
                            numberOfLines={2}
                            style={[
                                styles.title,
                                {
                                    textAlign: isRTL ? 'right' : 'left',
                                    writingDirection: isRTL ? 'rtl' : 'ltr',
                                },
                            ]}
                        >
                            {title}
                        </AppText>
                        {ctaText ? (
                            <View style={[styles.ctaPill, isRTL && styles.ctaPillRTL]}>
                                <AppText
                                    numberOfLines={1}
                                    style={[styles.ctaText, isRTL && styles.textRTL]}
                                >
                                    {ctaText}
                                </AppText>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.artWrap} pointerEvents="none">
                        {tileImages.map((imageUrl, index) => (
                            <View
                                key={`${currentItem.id}-tile-${index}`}
                                style={[
                                    styles.tile,
                                    index === 0
                                        ? styles.tile0
                                        : index === 1
                                            ? styles.tile1
                                            : styles.tile2,
                                ]}
                            >
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.tileImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                    accessibilityLabel={currentItem.altText || title}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingTop: HOME_SECTION_TOP_SPACING,
        paddingBottom: 0,
    },
    card: {
        position: 'relative',
        width: '100%',
        height: HOME_COMPACT_BANNER_HEIGHT,
        overflow: 'hidden',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: '#111111',
    },
    heroImage: {
        ...StyleSheet.absoluteFill,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
    },
    content: {
        height: HOME_COMPACT_BANNER_HEIGHT,
        paddingVertical: 10,
        paddingHorizontal: HOME_HORIZONTAL_GUTTER,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        zIndex: 1,
    },
    contentRTL: {
        flexDirection: 'row-reverse',
    },
    copy: {
        flex: 1,
        minWidth: 0,
        gap: 10,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        lineHeight: 25,
        ...Typography.getTextVariantStyle('display'),
        includeFontPadding: false,
    },
    ctaPill: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingVertical: 7,
        paddingHorizontal: 12,
        backgroundColor: '#18B852',
    },
    ctaPillRTL: {
        alignSelf: 'flex-end',
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 18,
        ...Typography.getTextVariantStyle('display'),
        textTransform: 'uppercase',
    },
    textRTL: {
        textAlign: 'right',
        writingDirection: 'rtl',
        textTransform: 'none',
    },
    artWrap: {
        position: 'relative',
        width: 100,
        height: 92,
        flexShrink: 0,
    },
    tile: {
        position: 'absolute',
        width: 44,
        height: 76,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.24)',
    },
    tile0: {
        left: 0,
        top: 12,
        transform: [{ rotate: '-5deg' }],
    },
    tile1: {
        left: 28,
        top: 3,
        zIndex: 2,
    },
    tile2: {
        left: 56,
        top: 12,
        transform: [{ rotate: '5deg' }],
    },
    tileImage: {
        width: '100%',
        height: '100%',
    },
});
