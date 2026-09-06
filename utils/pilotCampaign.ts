import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

export const BADRGO_PILOT_CAMPAIGN_ID = 'badrgo-first-ride-2026';

export type PilotCampaignClaim = {
  code: string;
  pool: 'public' | 'reserved';
  claimedAt: string | null;
};

export type PilotCampaign = {
  exists: boolean;
  campaignId?: string;
  brandName?: string;
  status: 'active' | 'scheduled' | 'sold_out' | 'unavailable';
  publicLimit?: number;
  publicAssignedCount?: number;
  remaining?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  instructions?: string;
  instructionsAr?: string;
  destinationUrl?: string;
  claim?: PilotCampaignClaim | null;
};

const campaignFunctions = () => getFunctions(undefined, 'me-central1');

export async function fetchBadrgoPilotCampaign(): Promise<PilotCampaign> {
  const callable = httpsCallable(campaignFunctions(), 'getBadrgoPilotCampaign');
  const result = await callable({ campaignId: BADRGO_PILOT_CAMPAIGN_ID });
  return result.data as PilotCampaign;
}

export async function claimBadrgoPilotCoupon(): Promise<PilotCampaignClaim> {
  const callable = httpsCallable(campaignFunctions(), 'claimBadrgoPilotCoupon');
  const result = await callable({ campaignId: BADRGO_PILOT_CAMPAIGN_ID });
  return result.data as PilotCampaignClaim;
}

export const badrgoPilotPreview: PilotCampaign = {
  exists: true,
  campaignId: BADRGO_PILOT_CAMPAIGN_ID,
  brandName: 'badrgo',
  status: 'active',
  publicLimit: 80,
  publicAssignedCount: 0,
  remaining: 80,
  title: 'Your next ride is on us',
  titleAr: 'مشوارك القادم علينا',
  description: 'The first 80 eligible realX users can claim one complimentary badrgo ride code.',
  descriptionAr: 'أول ٨٠ مستخدمًا مؤهلًا في realX يمكنهم الحصول على رمز رحلة مجانية من بدر جو.',
  instructions: 'Copy your personal code and apply it in badrgo. One code per verified realX account.',
  instructionsAr: 'انسخ رمزك الشخصي واستخدمه في بدر جو. رمز واحد لكل حساب realX موثّق.',
  destinationUrl: 'https://badrgo.com',
  claim: null,
};
