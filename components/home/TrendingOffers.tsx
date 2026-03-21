import { I18nManager, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { ThemedText } from '../ThemedText';

type OfferItem = {
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string;
};

type Props = {
    offers?: OfferItem[];
    onOfferPress?: (offer: OfferItem) => void;
};

export default function TrendingOffers({ offers, onOfferPress }: Props) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar' || I18nManager.isRTL;

    const defaultOffers: OfferItem[] = [
        { id: '1', title: t('offer_restaurant_title'), subtitle: t('offer_restaurant_subtitle') },
        { id: '2', title: t('offer_coffee_title'), subtitle: t('offer_coffee_subtitle') },
        { id: '3', title: t('offer_grocery_title'), subtitle: t('offer_grocery_subtitle') },
    ];

    const displayOffers = offers ?? defaultOffers;

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <ThemedText style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    <ThemedText style={styles.trendingText}>{t('trending_word')} </ThemedText>
                    <ThemedText style={styles.offersText}>{t('offers_word')}</ThemedText>
                </ThemedText>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}
            >
                {displayOffers.map((offer) => (
                    <TouchableOpacity
                        key={offer.id}
                        style={styles.offerCard}
                        onPress={() => onOfferPress?.(offer)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.imagePlaceholder}>
                            <ThemedText style={styles.placeholderEmoji}>🏷️</ThemedText>
                        </View>

                        <View style={styles.offerContent}>
                            <ThemedText
                                style={[
                                    styles.offerTitle,
                                    {
                                        textAlign: isRTL ? 'right' : 'left',
                                        writingDirection: isRTL ? 'rtl' : 'ltr',
                                    }
                                ]}
                                numberOfLines={1}
                            >
                                {offer.title}
                            </ThemedText>

                            <ThemedText
                                type="subtitle"
                                style={[
                                    styles.offerSubtitle,
                                    {
                                        textAlign: isRTL ? 'right' : 'left',
                                        writingDirection: isRTL ? 'rtl' : 'ltr',
                                    }
                                ]}
                                numberOfLines={1}
                            >
                                {offer.subtitle}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    headerContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
    },
    trendingText: {
        fontFamily: Typography.integral.bold,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    offersText: {
        fontFamily: Typography.integral.bold,
        color: Colors.brandGreen,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    offerCard: {
        width: 150,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imagePlaceholder: {
        width: '100%',
        height: 100,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: {
        fontSize: 40,
    },
    offerContent: {
        padding: 10,
    },
    offerTitle: {
        fontSize: 14,
        fontFamily: Typography.integral.bold,
        marginBottom: 2,
    },
    offerSubtitle: {
        fontSize: 12,
        fontFamily: Typography.integral.bold,
    },
});