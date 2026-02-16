import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

type BrandItem = {
    id: string;
    name: string;
    image: any;
};

const defaultBrands: BrandItem[] = [
    { id: '1', name: 'Brand 1', image: require('../../assets/images/coffee.png') },
    { id: '2', name: 'Brand 2', image: require('../../assets/images/food.png') },
    { id: '3', name: 'Brand 3', image: require('../../assets/images/grocery.png') },
    { id: '4', name: 'Brand 4', image: require('../../assets/images/pharma.png') },
    { id: '5', name: 'Brand 5', image: require('../../assets/images/entertainer.png') },
    { id: '6', name: 'Brand 6', image: require('../../assets/images/electronics.png') },
    { id: '7', name: 'Brand 7', image: require('../../assets/images/books.png') },
    { id: '8', name: 'Brand 8', image: require('../../assets/images/see-more.png') },
];

export default function BrandGrid() {
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    <Text style={styles.shopByText}>SHOP BY </Text>
                    <Text style={styles.brandText}>BRAND</Text>
                </Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {defaultBrands.map((brand) => (
                    <TouchableOpacity
                        key={brand.id}
                        style={styles.brandItem}
                        activeOpacity={0.7}
                    >
                        <View style={styles.imageContainer}>
                            <Image source={brand.image} style={styles.brandImage} resizeMode="contain" />
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
    shopByText: {
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
        letterSpacing: 1,
    },
    brandText: {
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.brandGreen,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    brandItem: {
        alignItems: 'center',
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    brandImage: {
        width: 45,
        height: 45,
    },
});
