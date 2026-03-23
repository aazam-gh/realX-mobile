import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import RestaurantCard from './RestaurantCard';

type Restaurant = {
    id: string;
    name: string;
    cashbackText?: string;
    discountText?: string;
    isTrending?: boolean;
    imageUri?: string;
    logoUri?: string;
    xcardEnabled?: boolean;
};

type Props = {
    title?: string;
    mainCategory?: string;
    restaurants?: Restaurant[];
    onRestaurantPress?: (restaurant: Restaurant) => void;
};

export default function BrowseSection({
    title,
    mainCategory,
    restaurants = [],
    onRestaurantPress,
}: Props) {
    const displayTitle = title || (mainCategory ? `Yallah! Browse ${mainCategory}` : 'Yallah! browse food');

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    {displayTitle}
                </Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {restaurants.map((restaurant) => (
                    <RestaurantCard
                        key={restaurant.id}
                        id={restaurant.id}
                        name={restaurant.name}
                        cashbackText={restaurant.cashbackText}
                        discountText={restaurant.discountText}
                        isTrending={restaurant.isTrending}
                        imageUri={restaurant.imageUri}
                        logoUri={restaurant.logoUri}
                        xcardEnabled={restaurant.xcardEnabled}
                        onPress={() => onRestaurantPress?.(restaurant)}
                        style={{ width: 170 }}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 16,
    },
    headerContainer: {
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Typography.poppins.semiBold,
        color: Colors.light.text,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
});
