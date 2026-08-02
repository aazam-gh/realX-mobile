import TrendingOffers from './TrendingOffers';

type NewDealsProps = {
    onVendorPress?: (vendor: any) => void;
};

export default function NewDeals({ onVendorPress }: NewDealsProps) {
    return <TrendingOffers variant="newDeals" onVendorPress={onVendorPress} />;
}
