import { ScrollView, StyleSheet, View } from 'react-native';
import PromoCard from './PromoCard';

type PromoItem = {
    id: string;
    title: string;
    subtitle: string;
    discount?: string;
    backgroundColor: string;
    accentColor?: string;
};

type Props = {
    promos?: PromoItem[];
    onPromoPress?: (promo: PromoItem) => void;
};

const defaultPromos: PromoItem[] = [
    {
        id: '1',
        title: 'TRENDING',
        subtitle: 'OFFERS',
        discount: 'Upto 50% OFF',
        backgroundColor: '#18B852',
        accentColor: '#FFFFFF',
    },
    {
        id: '2',
        title: 'STUDENT',
        subtitle: 'FEAST',
        discount: 'More than 50+',
        backgroundColor: '#E74C3C',
        accentColor: '#FFFFFF',
    },
    {
        id: '3',
        title: 'CASH',
        subtitle: 'BACK',
        discount: '30% Cashback',
        backgroundColor: '#F39C12',
        accentColor: '#FFFFFF',
    },
];

export default function PromoCarousel({ promos = defaultPromos, onPromoPress }: Props) {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={212}
                decelerationRate="fast"
            >
                {promos.map((promo) => (
                    <PromoCard
                        key={promo.id}
                        title={promo.title}
                        subtitle={promo.subtitle}
                        discount={promo.discount}
                        backgroundColor={promo.backgroundColor}
                        accentColor={promo.accentColor}
                        onPress={() => onPromoPress?.(promo)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
});
