import { getDocs } from '@react-native-firebase/firestore';

import { fetchCategoryVendorsPage, fetchVendorSearchPage } from '../firebaseQueries';
import { queryClient } from '../queryClient';

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(),
  documentId: jest.fn(() => '__name__'),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({})),
  limit: jest.fn((value) => ({ limit: value })),
  orderBy: jest.fn((...args) => ({ orderBy: args })),
  query: jest.fn((...args) => args),
  startAfter: jest.fn((...args) => ({ startAfter: args })),
  where: jest.fn((...args) => ({ where: args })),
}));

jest.mock('../vendorDisplayCache', () => ({
  getCachedVendorDisplayFields: jest.fn(),
}));

const mockedGetDocs = jest.mocked(getDocs);

function vendorDoc(id: string, data: Record<string, unknown>) {
  return { id, data: () => data } as any;
}

describe('vendor pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  afterAll(() => {
    queryClient.clear();
  });

  test('search continues past filtered documents and uses the raw cursor', async () => {
    mockedGetDocs
      .mockResolvedValueOnce({
        docs: [
          vendorDoc('vendor-1', { status: 'Inactive' }),
          vendorDoc('vendor-2', { name: 'Live 1' }),
        ],
      } as any)
      .mockResolvedValueOnce({
        docs: [vendorDoc('vendor-3', { name: 'Live 2' })],
      } as any);

    const page = await fetchVendorSearchPage('coffee', 2, null);

    expect(page.items.map((item) => item.id)).toEqual(['vendor-2', 'vendor-3']);
    expect(page.nextCursor).toBe('vendor-3');
    expect(page.reachedEnd).toBe(false);
    expect(mockedGetDocs).toHaveBeenCalledTimes(2);
  });

  test('category continues past a fully filtered raw page', async () => {
    mockedGetDocs
      .mockResolvedValueOnce({
        docs: [
          vendorDoc('vendor-1', { createdAt: 3, status: 'Draft' }),
          vendorDoc('vendor-2', { createdAt: 2, isActive: false }),
        ],
      } as any)
      .mockResolvedValueOnce({
        docs: [vendorDoc('vendor-3', { createdAt: 1, name: 'Live' })],
      } as any);

    const page = await fetchCategoryVendorsPage({
      categoryName: 'Food',
      searchQuery: '',
      selectedFilter: 'all',
      selectedSubCategory: 'all',
      pageSize: 2,
      cursor: null,
    });

    expect(page.items.map((item) => item.id)).toEqual(['vendor-3']);
    expect(page.nextCursor).toBeNull();
    expect(page.reachedEnd).toBe(true);
    expect(mockedGetDocs).toHaveBeenCalledTimes(2);
  });
});
