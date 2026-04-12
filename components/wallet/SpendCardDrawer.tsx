import { collection, getDocs, getFirestore, limit, orderBy, query, startAfter, where } from '@react-native-firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    I18nManager,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import PhonkText from '../PhonkText';
import RedeemGiftCard from './RedeemGiftCard';
import { useTranslation } from 'react-i18next';

type Props = {
    visible: boolean;
    onClose: () => void;
    balance: number;
    currency: string;
};

type BrandItem = {
    id: string;
    name: string;
    logo: string | null; // null for placeholder
    backgroundColor?: string;
    loyalty?: number[];
};

// Fetch dynamically instead of using placeholders

function BrandListItem({
    brand,
    isSelected,
    onSelect,
    isRTL,
}: {
    brand: BrandItem;
    isSelected: boolean;
    onSelect: () => void;
    isRTL: boolean;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.brandItem,
                isRTL && styles.brandItemRTL,
                isSelected && styles.brandItemSelected,
            ]}
            onPress={onSelect}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.brandLogo,
                    { backgroundColor: brand.backgroundColor || '#F0F0F0' },
                    isRTL ? { marginLeft: 14 } : { marginRight: 14 },
                ]}
            >
                {brand.logo ? (
                    <Image source={{ uri: brand.logo }} style={styles.brandLogoImage} />
                ) : (
                    <Text style={styles.brandLogoPlaceholder}>
                        {brand.name.charAt(0)}
                    </Text>
                )}
            </View>
            <Text style={[styles.brandName, { textAlign: isRTL ? 'right' : 'left' }]}>
                {brand.name}
            </Text>
        </TouchableOpacity>
    );
}

export default function SpendCardDrawer({
    visible,
    onClose,
    balance,
    currency,
}: Props) {
    const PAGE_SIZE = 10;
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const lastDocRef = useRef<any>(null);
    const [isListEnd, setIsListEnd] = useState(false);
    const { t } = useTranslation();
    const isRTL = I18nManager.isRTL;

    const fetchBrands = useCallback(async (isNew: boolean) => {
        if (loading || (loadingMore && !isNew) || (isListEnd && !isNew)) return;

        if (isNew) {
            setLoading(true);
            lastDocRef.current = null;
            setIsListEnd(false);
        } else {
            setLoadingMore(true);
        }

        try {
            const db = getFirestore();
            const constraints: any[] = [
                where('xcard', '==', true),
                orderBy('name', 'asc'),
            ];

            let q;
            if (isNew || !lastDocRef.current) {
                q = query(collection(db, 'vendors'), ...constraints, limit(PAGE_SIZE) as any);
            } else {
                q = query(collection(db, 'vendors'), ...constraints, startAfter(lastDocRef.current) as any, limit(PAGE_SIZE) as any);
            }

            const snapshot = await getDocs(q);

            const items: BrandItem[] = snapshot.docs.map((doc: any) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || 'Unknown',
                    logo: data.profilePicture || data.logoUrl || data.imageUrl || null,
                    backgroundColor: '#F0F0F0',
                    loyalty: data.loyalty || [],
                };
            });

            if (isNew) {
                setBrands(items);
            } else {
                setBrands(prev => [...prev, ...items]);
            }

            if (snapshot.docs.length > 0) {
                lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
                setIsListEnd(snapshot.docs.length < PAGE_SIZE);
            } else {
                setIsListEnd(true);
            }
        } catch (error) {
            console.error('Error fetching vendors for XCard:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [loading, loadingMore, isListEnd]);

    const fetchBrandsRef = useRef(fetchBrands);
    useEffect(() => { fetchBrandsRef.current = fetchBrands; }, [fetchBrands]);

    useEffect(() => {
        if (visible) {
            setBrands([]);
            setSearchQuery('');
            setSelectedBrandId(null);
            fetchBrandsRef.current(true);
        }
    }, [visible]);

    const filteredBrands = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleBrandSelect = (brandId: string) => {
        setSelectedBrandId(brandId);
    };

    const selectedBrand = brands.find(b => b.id === selectedBrandId);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {selectedBrand ? (
                    <RedeemGiftCard
                        brand={selectedBrand}
                        onBack={() => setSelectedBrandId(null)}
                        maxLimit={balance}
                        currency={currency}
                        onSuccess={onClose}
                    />
                ) : (
                    <>
                        {/* Header */}
                        <View style={[styles.header, isRTL && styles.headerRTL]}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.backArrow}>{isRTL ? '→' : '←'}</Text>
                        </TouchableOpacity>
                            <View style={styles.logoContainer}>
                                <PhonkText style={styles.logoX}>X</PhonkText>
                                <PhonkText style={styles.logoCard}>CARD</PhonkText>
                            </View>
                            <View style={styles.headerSpacer} />
                        </View>

                        {/* Balance Card */}
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>{t('available_balance')}</Text>
                            <PhonkText style={styles.balanceValue}>
                                {balance.toFixed(2)} {currency}
                            </PhonkText>
                        </View>

                        {/* Search Bar */}
                        <View style={[styles.searchContainer, isRTL && styles.searchContainerRTL]}>
                            <Text style={[styles.searchIcon, isRTL && styles.searchIconRTL]}>🔍</Text>
                            <TextInput
                                style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                placeholder={t('search_brands_placeholder')}
                                placeholderTextColor="#999999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Brand List */}
                        {loading ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={Colors.brandGreen} />
                            </View>
                        ) : (
                            <FlashList
                                data={filteredBrands}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <BrandListItem
                                        brand={item}
                                        isSelected={selectedBrandId === item.id}
                                        onSelect={() => handleBrandSelect(item.id)}
                                        isRTL={isRTL}
                                    />
                                )}
                                style={styles.brandList}
                                contentContainerStyle={[
                                    styles.brandListContent,
                                    { paddingBottom: insets.bottom + 20 },
                                ]}
                                showsVerticalScrollIndicator={false}
                                onEndReached={() => {
                                    if (!loadingMore && !isListEnd) {
                                        fetchBrands(false);
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                                ListFooterComponent={loadingMore ? (
                                    <ActivityIndicator size="small" color={Colors.brandGreen} style={{ paddingVertical: 16 }} />
                                ) : null}
                            />
                        )}
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerRTL: {
        flexDirection: 'row-reverse',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: 20,
        color: '#000000',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoX: {
        fontSize: 24,
        color: Colors.brandGreen,
    },
    logoCard: {
        fontSize: 24,
        color: '#000000',
    },
    headerSpacer: {
        width: 40,
    },
    balanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F8F8',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 12,
    },
    balanceLabel: {
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#666666',
    },
    balanceValue: {
        fontSize: 20,
        color: '#000000',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E8E8E8',
    },
    searchContainerRTL: {
        flexDirection: 'row-reverse',
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    searchIconRTL: {
        marginLeft: 10,
        marginRight: 0,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: Typography.poppins.medium,
        color: '#000000',
        padding: 0,
    },
    brandList: {
        flex: 1,
    },
    brandListContent: {
        paddingHorizontal: 16,
    },
    brandItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        borderRadius: 12,
        marginBottom: 4,
    },
    brandItemRTL: {
        flexDirection: 'row-reverse',
    },
    brandItemSelected: {
        backgroundColor: '#F0F8FF',
        borderWidth: 2,
        borderColor: '#007AFF',
        borderBottomWidth: 2,
    },
    brandLogo: {
        width: 48,
        height: 48,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandLogoImage: {
        width: '100%',
        height: '100%',
    },
    brandLogoPlaceholder: {
        fontSize: 18,
        fontFamily: Typography.poppins.semiBold,
        color: '#FFFFFF',
    },
    brandName: {
        fontSize: 15,
        fontFamily: Typography.poppins.medium,
        color: '#000000',
        flex: 1,
    },
});
