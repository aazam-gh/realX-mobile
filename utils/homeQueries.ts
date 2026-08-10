import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  type FirebaseFirestoreTypes,
  where,
} from '@react-native-firebase/firestore';
import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';

import type { Opportunity } from '../types/opportunities';
import {
  fetchCategories,
  fetchCmsDocument,
  fetchPublishedOpportunities,
  fetchVendor,
} from './firebaseQueries';
import { logger } from './logger';
import { queryClient, queryKeys } from './queryClient';

export type HomeLocale = 'en' | 'ar';
export type HomeOfferVariant = 'trending' | 'newDeals';

export type HomeCategoryItem = {
  id: string;
  name: string;
  englishName?: string;
  image?: string | number;
  icon?: string;
};

export type HomeBannerItem = {
  bannerId: string;
  altText: string;
  id?: string;
  images: {
    desktop?: string;
    mobile?: string;
  };
  isActive: boolean;
  vendorId?: string;
  lastUpdated?: string;
};

export type HomeFeaturedBannerItem = {
  id: string;
  vendorId?: string;
  title: string;
  titleAr?: string;
  ctaText?: string;
  orderUrl: string;
  isActive: boolean;
  heroImageUrl: string;
  tileImageUrls: string[];
  altText?: string;
  order?: number;
};

export type HomeBrandItem = {
  id: string;
  name: string;
  logoUrl: string;
  vendorId: string;
  isActive: boolean;
};

export type HomeOfferCard = {
  id: string;
  vendorId: string;
  nameEn?: string;
  nameAr?: string;
  vendorName?: string;
  vendorNameAr?: string;
  shortDescription?: string;
  shortDescriptionAr?: string;
  shortDescriptionAR?: string;
  brandDescription?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  bannerImage?: string;
  coverImage?: string;
  vendorProfilePicture?: string;
  profilePicture?: string;
  isTrending?: boolean;
  isTopRated?: boolean;
  xcard?: boolean;
  [key: string]: any;
};

type TrendingOfferBannerItem = {
  trendingOfferBannerId?: string;
  vendorId?: string;
  images?: {
    mobile?: string;
  };
  altText?: string;
  isActive?: boolean;
};

type HomePreloadOptions = {
  timeoutMs?: number;
  imagePrefetch?: (urls: string[]) => Promise<unknown>;
};

export type HomePreloadResult = {
  criticalReady: Promise<void>;
  completion: Promise<void>;
};

const TRENDING_FALLBACK_LIMIT = 10;
const DEFAULT_HOME_PRELOAD_TIMEOUT_MS = 2000;

function isLiveVendor(data: Record<string, unknown>) {
  return data.status !== 'Draft' && data.status !== 'Inactive' && data.isActive !== false;
}

function mapVendorDocToCard(
  vendorId: string,
  vendorData: Record<string, any>,
  customBannerImage?: string,
  isTrending = true,
): HomeOfferCard {
  return {
    id: vendorId,
    vendorId,
    nameEn: vendorData.nameEn || vendorData.name,
    nameAr: vendorData.nameAr || vendorData.name,
    vendorName: vendorData.name,
    vendorNameAr: vendorData.nameAr,
    shortDescription: vendorData.shortDescription,
    shortDescriptionAr: vendorData.shortDescriptionAr || vendorData.shortDescriptionAR,
    brandDescription: vendorData.brandDescription,
    descriptionEn: vendorData.descriptionEn,
    descriptionAr: vendorData.descriptionAr,
    vendorProfilePicture: vendorData.profilePicture,
    coverImage: vendorData.coverImage,
    bannerImage: customBannerImage || vendorData.bannerImage,
    xcard: vendorData.xcard || false,
    isTrending,
  };
}

async function fetchHomeOffers(variant: HomeOfferVariant): Promise<HomeOfferCard[]> {
  const db = getFirestore();
  const isTrendingSection = variant === 'trending';
  const vendorFlag = isTrendingSection ? 'isTrending' : 'isNewDeal';
  const cmsDocumentId = isTrendingSection ? 'trending-offer-banners' : 'new-deal-banners';

  const fetchLegacyVendors = async () => {
    const snapshot = await getDocs(query(
      collection(db, 'vendors'),
      where(vendorFlag, '==', true),
      limit(TRENDING_FALLBACK_LIMIT),
    ));

    return snapshot.docs
      .filter((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => isLiveVendor(docSnap.data()))
      .map((docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const vendorData = docSnap.data();
        queryClient.setQueryData(queryKeys.vendor(docSnap.id), { id: docSnap.id, data: vendorData });
        return mapVendorDocToCard(docSnap.id, vendorData, undefined, isTrendingSection);
      });
  };

  const cmsData = await fetchCmsDocument<{ items?: TrendingOfferBannerItem[] }>(cmsDocumentId);
  const activeCmsItems = (cmsData?.items || []).filter((item) => (
    item.isActive !== false
    && !!item.vendorId?.trim()
    && !!item.images?.mobile?.trim()
  ));

  let fetchedResults: HomeOfferCard[] = [];

  if (activeCmsItems.length > 0) {
    const vendorResults = await Promise.all(activeCmsItems.map(async (item) => {
      const vendorId = item.vendorId?.trim();
      const customBannerImage = item.images?.mobile?.trim();
      if (!vendorId || !customBannerImage) return null;

      const vendorResult = await queryClient.fetchQuery({
        queryKey: queryKeys.vendor(vendorId),
        queryFn: () => fetchVendor(vendorId),
      });
      if (!vendorResult) return null;

      return mapVendorDocToCard(
        vendorResult.id,
        vendorResult.data,
        customBannerImage,
        isTrendingSection,
      );
    }));

    fetchedResults = vendorResults.filter((item): item is HomeOfferCard => item !== null);
  }

  if (fetchedResults.length === 0) {
    logger.warn(`[${isTrendingSection ? 'TrendingOffers' : 'NewDeals'}] Using bounded legacy vendor fallback`, {
      limit: TRENDING_FALLBACK_LIMIT,
    });
    fetchedResults = await fetchLegacyVendors();
  }

  return fetchedResults;
}

export function isValidHomeFeaturedBanner(item: unknown): item is HomeFeaturedBannerItem {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<HomeFeaturedBannerItem>;
  return Boolean(
    candidate.isActive === true
    && typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.orderUrl === 'string'
    && typeof candidate.heroImageUrl === 'string'
    && Array.isArray(candidate.tileImageUrls)
    && candidate.tileImageUrls.length >= 3
    && candidate.tileImageUrls.slice(0, 3).every((url) => typeof url === 'string' && url.length > 0),
  );
}

export const homeQueryOptions = {
  categories: (locale: HomeLocale) => queryOptions<HomeCategoryItem[]>({
    queryKey: queryKeys.categories(locale),
    queryFn: () => fetchCategories(locale === 'ar'),
  }),
  promoBanners: () => queryOptions<HomeBannerItem[]>({
    queryKey: queryKeys.cmsDocument('banner'),
    queryFn: async () => {
      const data = await fetchCmsDocument<{ banners?: HomeBannerItem[] }>('banner');
      return (data?.banners || []).filter((banner) => banner.isActive);
    },
  }),
  offers: (variant: HomeOfferVariant) => queryOptions<HomeOfferCard[]>({
    queryKey: variant === 'trending' ? queryKeys.trendingOffers() : queryKeys.newDeals(),
    queryFn: () => fetchHomeOffers(variant),
  }),
  featuredBanner: () => queryOptions<HomeFeaturedBannerItem | null>({
    queryKey: queryKeys.cmsDocument('featuredBrandShowcase'),
    queryFn: async () => {
      const data = await fetchCmsDocument<{ items?: HomeFeaturedBannerItem[] }>('featuredBrandShowcase');
      return (data?.items || [])
        .filter(isValidHomeFeaturedBanner)
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))[0] ?? null;
    },
  }),
  brands: () => queryOptions<HomeBrandItem[]>({
    queryKey: queryKeys.cmsDocument('brand'),
    queryFn: async () => {
      const data = await fetchCmsDocument<{ brands?: HomeBrandItem[] }>('brand');
      return (data?.brands || [])
        .filter((brand) => brand.isActive)
        .map((brand) => ({
          id: brand.id,
          name: brand.name,
          logoUrl: brand.logoUrl,
          vendorId: brand.vendorId,
          isActive: brand.isActive,
        }));
    },
  }),
  opportunities: () => queryOptions<Opportunity[]>({
    queryKey: queryKeys.opportunities(),
    queryFn: fetchPublishedOpportunities,
  }),
};

function getCriticalImageUrls(client: QueryClient, locale: HomeLocale) {
  const banners = client.getQueryData<HomeBannerItem[]>(queryKeys.cmsDocument('banner')) || [];
  const categories = client.getQueryData<HomeCategoryItem[]>(queryKeys.categories(locale)) || [];
  const offers = client.getQueryData<HomeOfferCard[]>(queryKeys.trendingOffers()) || [];

  return Array.from(new Set([
    ...banners.map((banner) => banner.images.mobile || banner.images.desktop),
    ...categories.slice(0, 7).map((category) => typeof category.image === 'string' ? category.image : undefined),
    ...offers.slice(0, 4).flatMap((offer) => [
      offer.bannerImage,
      offer.coverImage,
      offer.vendorProfilePicture,
    ]),
  ].filter((url): url is string => typeof url === 'string' && url.length > 0)));
}

function capPromise(promise: Promise<unknown>, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    void promise.finally(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export function preloadHomeData(
  locale: HomeLocale,
  client: QueryClient = queryClient,
  options: HomePreloadOptions = {},
): HomePreloadResult {
  const timeoutMs = options.timeoutMs ?? DEFAULT_HOME_PRELOAD_TIMEOUT_MS;
  const imagePrefetch = options.imagePrefetch ?? ((urls: string[]) => Image.prefetch(urls, 'memory-disk'));

  const categories = client.fetchQuery(homeQueryOptions.categories(locale));
  const banners = client.fetchQuery(homeQueryOptions.promoBanners());
  const trending = client.fetchQuery(homeQueryOptions.offers('trending'));
  const allTasks = [
    categories,
    banners,
    trending,
    client.fetchQuery(homeQueryOptions.offers('newDeals')),
    client.fetchQuery(homeQueryOptions.featuredBanner()),
    client.fetchQuery(homeQueryOptions.brands()),
    client.fetchQuery(homeQueryOptions.opportunities()),
  ];

  const criticalWork = Promise.allSettled([categories, banners, trending])
    .then(async () => {
      const urls = getCriticalImageUrls(client, locale);
      if (urls.length > 0) {
        await imagePrefetch(urls).catch((error) => {
          logger.warn('Unable to prefetch Home images:', error);
        });
      }
    });

  return {
    criticalReady: capPromise(criticalWork, timeoutMs),
    completion: Promise.allSettled(allTasks).then(() => undefined),
  };
}
