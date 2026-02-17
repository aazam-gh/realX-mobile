
import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

export default function VendorScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [vendor, setVendor] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const db = getFirestore();

                // Fetch Vendor
                const vendorRef = doc(db, 'vendors', id);
                const vendorSnap = await getDoc(vendorRef);

                if (vendorSnap.exists()) {
                    setVendor(vendorSnap.data());
                }

                // Fetch Offers
                const offersRef = collection(db, 'offers');
                const q = query(offersRef, where('vendorId', '==', id), where('status', '==', 'active'));
                const querySnapshot = await getDocs(q);

                const fetchedOffers = querySnapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setOffers(fetchedOffers);
            } catch (error) {
                console.error("Error fetching vendor data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.brandGreen} />
            </View>
        );
    }

    if (!vendor) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Vendor not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Image Section */}
                <View style={styles.headerContainer}>
                    <Image
                        source={{ uri: vendor.coverImage }}
                        style={styles.coverImage}
                        contentFit="cover"
                        transition={200}
                    />

                    {/* Header Buttons */}
                    <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                        <View style={styles.headerButtonsRow}>
                            <TouchableOpacity
                                style={styles.roundButton}
                                onPress={() => router.back()}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={24} color="#000" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.roundButton}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="share-outline" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {/* Vendor Logo Overlapping */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={{ uri: vendor.profilePicture }}
                            style={styles.logoImage}
                            contentFit="cover"
                        />
                    </View>

                    {/* Chips on cover image */}
                    <View style={styles.coverChipsContainer}>
                        <View style={styles.cashbackChip}>
                            <View style={styles.cashbackIconBg}>
                                <Text style={styles.cashbackIcon}>$</Text>
                            </View>
                            <Text style={styles.cashbackText}>CASHBACKS</Text>
                        </View>

                        <View style={styles.trendingChip}>
                            <Ionicons name="flash" size={12} color="#FFF" />
                            <Text style={styles.trendingText}>TRENDING</Text>
                        </View>
                    </View>

                    {/* Zigzag decoration at bottom of image - simplified as white background */}
                </View>

                {/* Vendor Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.vendorHeaderRow}>
                        <Text style={styles.vendorName}>{vendor.name}</Text>

                        {/* Right side chips */}
                        <View style={styles.rightChips}>
                            <View style={styles.infoChip}>
                                <Text style={styles.infoChipText}>(ibo)</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>5.0</Text>
                        </View>

                        {vendor.category && vendor.category.length > 0 && (
                            <View style={styles.categoryChip}>
                                <Text style={styles.categoryEmoji}>☕</Text>
                                <Text style={styles.categoryText}>{vendor.category[0]}</Text>
                            </View>
                        )}
                    </View>

                    {/* Offers List */}
                    <View style={styles.offersList}>
                        {offers.map((offer) => (
                            <View key={offer.id} style={styles.offerCard}>
                                <View style={styles.offerContent}>
                                    <Text style={styles.offerTitle}>
                                        FLAT <Text style={styles.greenText}>
                                            {offer.discountValue}{offer.discountType === 'percentage' ? '%' : ''}
                                        </Text> OFF
                                    </Text>
                                    <Text style={styles.offerSubtitle}>In-store</Text>

                                    <View style={styles.offerActions}>
                                        <TouchableOpacity style={styles.viewTcButton}>
                                            <Ionicons name="information-circle-outline" size={18} color="#999" />
                                            <Text style={styles.viewTcText}>View T&C</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.redeemButton}
                                            onPress={() => router.push(`/redeem/${offer.id}?vendorId=${id}`)}
                                        >
                                            <Ionicons name="flash" size={16} color="#FFF" style={{ marginRight: 4 }} />
                                            <Text style={styles.redeemText}>REDEEM</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontFamily: Typography.metropolis.medium,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        height: 250,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    roundButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    logoContainer: {
        position: 'absolute',
        bottom: -20, // Overlap
        left: 20,
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#1E2a38', // Dark background based on screenshot
        padding: 4,
        zIndex: 5,
        elevation: 5,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    coverChipsContainer: {
        position: 'absolute',
        bottom: 20, // Just above the bottom of image
        right: 16,
        flexDirection: 'row',
        gap: 8,
    },
    cashbackChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingRight: 8,
        paddingLeft: 4,
        paddingVertical: 4,
    },
    cashbackIconBg: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#18B852',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    cashbackIcon: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cashbackText: {
        fontSize: 12,
        color: '#18B852',
        fontWeight: 'bold',
    },
    trendingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFA500',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    trendingText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: 'bold',
    },
    detailsContainer: {
        paddingTop: 30, // Space for logo overlap
        paddingHorizontal: 20,
    },
    vendorHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    vendorName: {
        fontSize: 24,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
    },
    rightChips: {
        flexDirection: 'row',
        gap: 8,
    },
    infoChip: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    infoChipText: {
        fontSize: 12,
        color: '#333',
        fontFamily: Typography.metropolis.medium,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontFamily: Typography.metropolis.semiBold,
        color: Colors.light.text,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    categoryEmoji: {
        fontSize: 12,
    },
    categoryText: {
        fontSize: 12,
        color: '#666',
        fontFamily: Typography.metropolis.medium,
    },
    offersList: {
        marginTop: 24,
        gap: 16,
    },
    offerCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 20,
        padding: 16,
        marginBottom: 8,
    },
    offerContent: {
        gap: 8,
    },
    offerTitle: {
        fontSize: 24,
        fontFamily: Typography.integral.bold,
        color: '#000',
        letterSpacing: -0.5,
    },
    greenText: {
        color: Colors.brandGreen,
    },
    offerSubtitle: {
        fontSize: 14,
        color: '#888',
        fontFamily: Typography.metropolis.medium,
        marginBottom: 8,
    },
    offerActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    viewTcButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderRadius: 25,
        gap: 6,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    viewTcText: {
        fontSize: 14,
        color: '#888',
        fontFamily: Typography.metropolis.medium,
    },
    redeemButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.brandGreen,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 6,
        shadowColor: Colors.brandGreen,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    redeemText: {
        fontSize: 14,
        color: '#FFF',
        fontFamily: Typography.metropolis.semiBold,
        fontWeight: 'bold',
    },
});
