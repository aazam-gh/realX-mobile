import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

export const BADRGO_PILOT_CAMPAIGN_ID = 'badrgo-rides';
export const BADRGO_INVITE_URL = 'https://go.badrgo.com/invite?code=R1AA52';

export type PilotCampaignClaim = {
  id?: string;
  code: string;
  pool?: 'public' | 'reserved';
  status?: 'assigned' | 'redeemed' | 'expired' | 'revoked';
  periodKey?: string | null;
  claimedAt: string | null;
  redeemedAt?: string | null;
};

export type VoucherEligibilityReason =
  | 'eligible'
  | 'auth_required'
  | 'previous_code_not_redeemed'
  | 'already_claimed_this_week'
  | 'program_paused'
  | 'program_ended'
  | 'out_of_stock';

export type PilotCampaign = {
  exists: boolean;
  campaignId?: string;
  brandName?: string;
  status: 'active' | 'paused' | 'ended' | 'out_of_stock' | 'unavailable';
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
  currentClaim?: PilotCampaignClaim | null;
  recentClaims?: Array<Omit<PilotCampaignClaim, 'code'> & { code?: string }>;
  eligibility?: {
    canClaim: boolean;
    reason: VoucherEligibilityReason;
    periodKey: string;
    nextEligibleAt: string | null;
  };
};

const campaignFunctions = () => getFunctions(undefined, 'me-central1');

export async function fetchBadrgoPilotCampaign(): Promise<PilotCampaign> {
  const callable = httpsCallable(campaignFunctions(), 'getBadrgoVoucherProgram');
  const result = await callable({});
  return result.data as PilotCampaign;
}

export async function claimBadrgoPilotCoupon(): Promise<PilotCampaignClaim> {
  const callable = httpsCallable(campaignFunctions(), 'claimBadrgoVoucher');
  const result = await callable({});
  return result.data as PilotCampaignClaim;
}

export const badrgoPilotPreview: PilotCampaign = {
  exists: true,
  campaignId: BADRGO_PILOT_CAMPAIGN_ID,
  brandName: 'badrgo',
  status: 'active',
  publicLimit: 1000,
  publicAssignedCount: 0,
  remaining: 1000,
  title: 'Your next ride is on us',
  titleAr: 'مشوارك القادم علينا',
  description: 'Claim a badrgo ride code when you are eligible.',
  descriptionAr: 'احصل على رمز رحلة من بدر جو عند استحقاقك.',
  instructions: 'Use your current code before requesting another code in a future week.',
  instructionsAr: 'استخدم رمزك الحالي قبل طلب رمز آخر في أسبوع لاحق.',
  destinationUrl: BADRGO_INVITE_URL,
  claim: null,
  currentClaim: null,
  recentClaims: [],
  eligibility: {
    canClaim: true,
    reason: 'eligible',
    periodKey: 'preview-week',
    nextEligibleAt: null,
  },
};
