import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { getGridColumns } from '../utils/responsive';
import { RestaurantCard } from '../components/category';
import { useAppTheme } from '../context/AppThemeContext';
import { useAppLocale } from '../context/LocaleContext';
import { Typography } from '../constants/Typography';
import { triggerSubtleHaptic } from '../utils/haptics';
import { queryClient, queryKeys, TRANSIENT_QUERY_GC_TIME_MS } from '../utils/queryClient';
import { fetchTrendingVendorRecommendations, fetchVendorSearchPage, VendorQueryItem } from '../utils/firebaseQueries';
import { useRealXRefresh } from '../components/PullToRefresh';
import { HeaderIconButton } from '../components/navigation/AppHeader';

const RECOMMENDATION_LIMIT = 6;

export default function SearchScreen() {
    const { q } = useLocalSearchParams<{ q: string }>();
    const router = useRouter();
    const { t } = useTranslation();
    const { isDark, theme } = useAppTheme();
    const { locale } = useAppLocale();
    const isArabic = locale === 'ar';
    const { width } = useWindowDimensions();
    const gridColumns = getGridColumns(width);

    const [searchQuery, setSearchQuery] = useState(q || '');
    const [committedQuery, setCommittedQuery] = useState((q || '').trim().toLowerCase());
    const [results, setResults] = useState<VendorQueryItem[]>([]);
    const [recommendations, setRecommendations] = useState<VendorQueryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const cursorRef = useRef<string | null>(null);
    const fetchingRef = useRef(false);
    const requestIdRef = useRef(0);
    const searchInputRef = useRef<TextInput>(null);
    const [isListEnd, setIsListEnd] = useState(false);
    // Fetch vendors with pagination — only when user has typed a query
    const fetchVendors = useCallback(async (isNew = false, currentQuery?: string) => {
        const trimmedQuery = (currentQuery ?? committedQuery).trim().toLowerCase();

        if (!trimmedQuery) {
            requestIdRef.current += 1;
            fetchingRef.current = false;
            setResults([]);
            setRecommendations([]);
            cursorRef.current = null;
            setIsListEnd(true);
            setLoading(false);
            setLoadingMore(false);
            return;
        }

        if (!isNew && (fetchingRef.current || isListEnd)) return;

        const requestId = ++requestIdRef.current;
        fetchingRef.current = true;

        if (isNew) {
            setLoading(true);
            setRecommendations([]);
            cursorRef.current = null;
            setIsListEnd(false);
        } else {
            setLoadingMore(true);
        }

        try {
            const PAGE_SIZE = 20;
            const cursor = isNew ? null : cursorRef.current;
            const page = await queryClient.fetchQuery({
                queryKey: queryKeys.searchVendorsPage(trimmedQuery, cursor),
                queryFn: () => fetchVendorSearchPage(trimmedQuery, PAGE_SIZE, cursor),
                gcTime: TRANSIENT_QUERY_GC_TIME_MS,
            });
            if (requestId !== requestIdRef.current) return;

            if (isNew) {
                setResults(page.items);
            } else {
                setResults(prev => [...prev, ...page.items]);
            }
            cursorRef.current = page.nextCursor;
            setIsListEnd(page.reachedEnd);
        } catch (error) {
            if (requestId !== requestIdRef.current) return;
            logger.error('Error fetching vendors for search:', error);
        } finally {
            if (requestId !== requestIdRef.current) return;
            fetchingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [isListEnd, committedQuery]);

    const fetchVendorsRef = useRef(fetchVendors);
    useEffect(() => {
        fetchVendorsRef.current = fetchVendors;
    }, [fetchVendors]);

    const refreshSearch = useCallback(async () => {
        if (!committedQuery) return;
        await fetchVendorsRef.current(true, committedQuery);
        await queryClient.refetchQueries({ queryKey: queryKeys.trendingVendorRecommendations(), type: 'active' });
    }, [committedQuery]);
    const { refreshControl, refreshOverlay } = useRealXRefresh({ onRefresh: refreshSearch });

    useEffect(() => {
        fetchVendorsRef.current(true, committedQuery);
    }, [committedQuery]);

    useEffect(() => () => {
        requestIdRef.current += 1;
    }, []);

    const hasNoResults = Boolean(committedQuery) && !loading && isListEnd && results.length === 0;

    useEffect(() => {
        let isCurrent = true;

        if (!hasNoResults) {
            setRecommendations([]);
            setLoadingRecommendations(false);
            return () => {
                isCurrent = false;
            };
        }

        setLoadingRecommendations(true);
        void queryClient.fetchQuery({
            queryKey: queryKeys.trendingVendorRecommendations(),
            queryFn: () => fetchTrendingVendorRecommendations(RECOMMENDATION_LIMIT),
        }).then((items) => {
            if (isCurrent) setRecommendations(items);
        }).catch((error) => {
            logger.error('Error fetching search recommendations:', error);
            if (isCurrent) setRecommendations([]);
        }).finally(() => {
            if (isCurrent) setLoadingRecommendations(false);
        });

        return () => {
            isCurrent = false;
        };
    }, [hasNoResults]);

    const handleSubmitSearch = useCallback(() => {
        const trimmed = searchQuery.trim().toLowerCase();
        setCommittedQuery(trimmed);
    }, [searchQuery]);

    const handleVendorPress = useCallback(
        (vendor: any) => {
            router.push({ pathname: '/vendor/[id]', params: { id: vendor.id } });
        },
        [router]
    );

    const handleLoadMore = () => {
        if (!isListEnd && !loadingMore && !loading) {
            fetchVendors(false);
        }
    };

    const handleTryAnotherSearch = useCallback(() => {
        triggerSubtleHaptic();
        setSearchQuery('');
        setCommittedQuery('');
        requestAnimationFrame(() => searchInputRef.current?.focus());
    }, []);

    const renderItem = useCallback(
        ({ item, index }: { item: any; index: number }) => (
            <View
                style={[
                    styles.cardWrapper,
                    {
                        paddingStart: index % gridColumns === 0 ? 20 : 8,
                        paddingEnd: index % gridColumns === gridColumns - 1 ? 20 : 8,
                    },
                ]}
            >
                <RestaurantCard
                    id={item.id}
                    name={isArabic ? (item.nameAr || item.nameEn || item.name || 'Vendor') : (item.nameEn || item.name || 'Vendor')}
                    cashbackText={isArabic ? (item.shortDescriptionAR || item.shortDescriptionAr || item.descriptionAr || item.brandDescription || '') : (item.shortDescription || item.brandDescription || item.descriptionEn || '')}
                    imageUri={item.coverImage}
                    logoUri={item.profilePicture}
                    xcardEnabled={item.xcard}
                    onPress={() => handleVendorPress(item)}
                />
            </View>
        ),
        [gridColumns, handleVendorPress, isArabic]
    );

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={styles.loaderFooter}>
                <ActivityIndicator size="small" color={theme.brand} />
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar style={isDark ? 'light' : 'dark'} animated />

            {/* Header */}
            <View style={styles.header}>
                <HeaderIconButton
                    icon={isArabic ? 'arrow-forward' : 'arrow-back'}
                    onPress={() => router.back()}
                    accessibilityLabel={t('back')}
                />

                <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                    <Ionicons name="search" size={18} color={theme.brand} />
                    <TextInput
                        style={[
                            styles.searchInput,
                            {
                                color: theme.text,
                                textAlign: isArabic ? 'right' : 'left',
                                writingDirection: isArabic ? 'rtl' : 'ltr',
                            },
                        ]}
                        placeholder={t('search_offers_placeholder')}
                        placeholderTextColor={theme.inputPlaceholder}
                        value={searchQuery}
                        ref={searchInputRef}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={handleSubmitSearch}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={t('clear')}
                            onPress={() => {
                                triggerSubtleHaptic();
                                setSearchQuery('');
                                setCommittedQuery('');
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close-circle" size={18} color={theme.iconMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={theme.brand} />
                </View>
            ) : hasNoResults ? (
                <FlatList
                    data={recommendations}
                    keyExtractor={(item) => item.id}
                    numColumns={gridColumns}
                    renderItem={renderItem}
                    contentContainerStyle={styles.noResultsContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={refreshControl}
                    ListHeaderComponent={
                        <View style={styles.noResultsHeader}>
                            <View style={styles.noOffersEmptyState}>
                                <View style={[styles.noOffersIcon, { backgroundColor: theme.brandSoft }]}>
                                    <Ionicons name="search-outline" size={22} color={theme.brand} />
                                </View>
                                <Text style={[{ color: theme.text, ...Typography.getLocalizedTextVariantStyle('bodyStrong', locale) }, styles.noOffersTitle, isArabic && styles.textRTL]}>
                                    {t('search_offers_no_results_title')}
                                </Text>
                                <Text style={[{ color: theme.mutedText, ...Typography.getLocalizedTextVariantStyle('body', locale) }, styles.noOffersSubtitle, isArabic && styles.textRTL]}>
                                    {t('search_offers_no_results_hint', { query: committedQuery })}
                                </Text>
                                <TouchableOpacity
                                    style={styles.tryAnotherButton}
                                    onPress={handleTryAnotherSearch}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="refresh-outline" size={16} color={theme.brand} />
                                    <Text style={[styles.tryAnotherText, { color: theme.brand, ...Typography.getLocalizedTextVariantStyle('bodyStrong', locale) }, isArabic && styles.textRTL]}>
                                        {t('search_try_another')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {loadingRecommendations ? (
                                <View style={styles.recommendationLoading}>
                                    <ActivityIndicator size="small" color={theme.brand} />
                                    <Text style={[{ color: theme.mutedText, ...Typography.getLocalizedTextVariantStyle('body', locale) }, isArabic && styles.textRTL]}>
                                        {t('search_recommendations_loading')}
                                    </Text>
                                </View>
                            ) : recommendations.length > 0 ? (
                                <Text style={[styles.recommendationsTitle, { color: theme.text, alignSelf: isArabic ? 'flex-end' : 'flex-start', ...Typography.getLocalizedTextVariantStyle('bodyStrong', locale) }, isArabic && styles.textRTL]}>
                                    {t('search_recommendations_title')}
                                </Text>
                            ) : null}
                        </View>
                    }
                />
            ) : results.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <View style={styles.noOffersEmptyState}>
                        <View style={[styles.noOffersIcon, { backgroundColor: theme.brandSoft }]}>
                            <Ionicons name="search-outline" size={22} color={theme.brand} />
                        </View>
                        <Text style={[{ color: theme.text, ...Typography.getLocalizedTextVariantStyle('bodyStrong', locale) }, styles.noOffersTitle, isArabic && styles.textRTL]}>
                            {t('search_offers_empty_title')}
                        </Text>
                        <Text style={[{ color: theme.mutedText, ...Typography.getLocalizedTextVariantStyle('body', locale) }, styles.noOffersSubtitle, isArabic && styles.textRTL]}>
                            {t('search_offers_empty_hint')}
                        </Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    numColumns={gridColumns}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={refreshControl}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListHeaderComponent={
                        <View style={styles.resultCountRow}>
                            <Text style={[{ color: theme.mutedText, ...Typography.getTextVariantStyle('body') }, styles.resultCount, isArabic && styles.textRTL]}>
                                {t('search_results_count', { count: results.length })}
                            </Text>
                        </View>
                    }
                />
            )}
            {refreshOverlay}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 28,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        ...Typography.getTextVariantStyle('body'),
        padding: 0,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    noOffersEmptyState: {
        width: '100%',
        maxWidth: 300,
        paddingVertical: 24,
        alignItems: 'center',
    },
    noOffersIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    noOffersTitle: {
        fontSize: 18,
        ...Typography.getTextVariantStyle('bodyStrong'),
        textAlign: 'center',
        lineHeight: 24,
    },
    noOffersSubtitle: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
        marginTop: 6,
    },
    noResultsContent: {
        paddingBottom: 40,
    },
    noResultsHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    tryAnotherButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 6,
    },
    tryAnotherText: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('bodyStrong'),
    },
    recommendationLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 28,
    },
    recommendationsTitle: {
        alignSelf: 'flex-start',
        fontSize: 18,
        ...Typography.getTextVariantStyle('bodyStrong'),
        paddingTop: 28,
        paddingBottom: 16,
    },
    resultCount: {
        fontSize: 14,
        ...Typography.getTextVariantStyle('body'),
        paddingTop: 8,
        paddingBottom: 16,
    },
    resultCountRow: {
        width: '100%',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
    },
    textRTL: {
        writingDirection: 'rtl',
    },
    listContent: {
        paddingBottom: 40,
    },
    cardWrapper: {
        flex: 1,
        marginBottom: 16,
    },
    loaderFooter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
