import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';
import { queryClient, queryKeys } from './queryClient';

export type VendorDisplayFields = {
    profilePicture: string | null;
    logoUrl: string | null;
    imageUrl: string | null;
    name: string | null;
    vendorName: string | null;
    nameAr: string | null;
    vendorNameAr: string | null;
};

const VENDOR_DISPLAY_STALE_TIME_MS = 30 * 60 * 1000;

const stringOrNull = (value: unknown) => (typeof value === 'string' && value.length > 0 ? value : null);

export const getCachedVendorDisplayFields = async (vendorId: string): Promise<VendorDisplayFields | null> => {
    const normalizedVendorId = vendorId.trim();
    if (!normalizedVendorId) return null;

    return queryClient.fetchQuery({
        queryKey: queryKeys.vendorDisplay(normalizedVendorId),
        queryFn: async () => {
            const vendorSnap = await getDoc(doc(getFirestore(), 'vendors', normalizedVendorId));
            const vendorData = vendorSnap.exists() ? vendorSnap.data() : null;

            return vendorData
                ? {
                    profilePicture: stringOrNull(vendorData.profilePicture),
                    logoUrl: stringOrNull(vendorData.logoUrl),
                    imageUrl: stringOrNull(vendorData.imageUrl),
                    name: stringOrNull(vendorData.name),
                    vendorName: stringOrNull(vendorData.vendorName),
                    nameAr: stringOrNull(vendorData.nameAr),
                    vendorNameAr: stringOrNull(vendorData.vendorNameAr),
                }
                : null;
        },
        staleTime: VENDOR_DISPLAY_STALE_TIME_MS,
    });
};
