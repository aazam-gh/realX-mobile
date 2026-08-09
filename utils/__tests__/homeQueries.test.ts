import { QueryClient } from '@tanstack/react-query';

import { preloadHomeData } from '../homeQueries';
import { queryClient, queryKeys } from '../queryClient';

const mockFetchCategories = jest.fn();
const mockFetchCmsDocument = jest.fn();
const mockFetchPublishedOpportunities = jest.fn();
const mockFetchVendor = jest.fn();

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({})),
  limit: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('../firebaseQueries', () => ({
  fetchCategories: (...args: unknown[]) => mockFetchCategories(...args),
  fetchCmsDocument: (...args: unknown[]) => mockFetchCmsDocument(...args),
  fetchPublishedOpportunities: (...args: unknown[]) => mockFetchPublishedOpportunities(...args),
  fetchVendor: (...args: unknown[]) => mockFetchVendor(...args),
}));

jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

describe('Home preloading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    mockFetchCategories.mockResolvedValue([
      { id: 'food', name: 'مطاعم', englishName: 'Restaurants', image: 'https://img/category.png' },
    ]);
    mockFetchCmsDocument.mockImplementation(async (documentId: string) => {
      switch (documentId) {
        case 'banner':
          return {
            banners: [{
              bannerId: 'banner-1',
              altText: 'Banner',
              images: { mobile: 'https://img/banner.png' },
              isActive: true,
            }],
          };
        case 'trending-offer-banners':
        case 'new-deal-banners':
          return {
            items: [{
              vendorId: 'vendor-1',
              images: { mobile: 'https://img/offer.png' },
              isActive: true,
            }],
          };
        case 'featuredBrandShowcase':
          return {
            items: [{
              id: 'featured-1',
              title: 'Featured',
              orderUrl: 'https://example.com',
              isActive: true,
              heroImageUrl: 'https://img/featured.png',
              tileImageUrls: ['https://img/1.png', 'https://img/2.png', 'https://img/3.png'],
            }],
          };
        case 'brand':
          return {
            brands: [{
              id: 'brand-1',
              name: 'Brand',
              logoUrl: 'https://img/brand.png',
              vendorId: 'vendor-1',
              isActive: true,
            }],
          };
        default:
          return null;
      }
    });
    mockFetchPublishedOpportunities.mockResolvedValue([{ id: 'opportunity-1', status: 'published' }]);
    mockFetchVendor.mockResolvedValue({
      id: 'vendor-1',
      data: { name: 'Vendor', profilePicture: 'https://img/logo.png' },
    });
  });

  afterAll(() => {
    queryClient.clear();
  });

  test('warms every Home query and locale-specific category key', async () => {
    const client = createClient();
    const imagePrefetch = jest.fn().mockResolvedValue(true);
    const preload = preloadHomeData('ar', client, { timeoutMs: 100, imagePrefetch });

    await Promise.all([preload.criticalReady, preload.completion]);

    expect(client.getQueryData(queryKeys.categories('ar'))).toHaveLength(1);
    expect(client.getQueryData(queryKeys.cmsDocument('banner'))).toHaveLength(1);
    expect(client.getQueryData(queryKeys.trendingOffers())).toHaveLength(1);
    expect(client.getQueryData(queryKeys.newDeals())).toHaveLength(1);
    expect(client.getQueryData(queryKeys.cmsDocument('featuredBrandShowcase'))).toBeTruthy();
    expect(client.getQueryData(queryKeys.cmsDocument('brand'))).toHaveLength(1);
    expect(client.getQueryData(queryKeys.opportunities())).toHaveLength(1);
    expect(imagePrefetch).toHaveBeenCalledWith(expect.arrayContaining([
      'https://img/banner.png',
      'https://img/category.png',
      'https://img/offer.png',
    ]));
    client.clear();
  });

  test('critical readiness resolves when a critical query fails', async () => {
    const client = createClient();
    mockFetchCategories.mockRejectedValueOnce(new Error('offline'));

    const preload = preloadHomeData('en', client, {
      timeoutMs: 20,
      imagePrefetch: jest.fn().mockResolvedValue(true),
    });

    await expect(preload.criticalReady).resolves.toBeUndefined();
    await expect(preload.completion).resolves.toBeUndefined();
    client.clear();
  });
});
