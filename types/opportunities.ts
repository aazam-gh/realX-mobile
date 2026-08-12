type OpportunityKind =
  | 'event'
  | 'career'
  | 'learning'
  | 'experience'
  | 'entrepreneurship';

export type Opportunity = {
  id: string;
  kind: OpportunityKind;
  titleEn: string;
  titleAr?: string;
  summaryEn?: string;
  summaryAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  providerName?: string;
  imageUrl?: string;
  locationEn?: string;
  locationAr?: string;
  locationMode?: 'onsite' | 'remote' | 'hybrid';
  startsAt?: unknown;
  endsAt?: unknown;
  deadline?: unknown;
  featured?: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: unknown;
  expiresAt?: unknown;
};
