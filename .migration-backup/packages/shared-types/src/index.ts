// @kunda/shared-types — shared across all apps and services
export type UserRole      = "BUYER"|"SELLER"|"AGENT"|"ADMIN";
export type KycStatus     = "PENDING"|"SUBMITTED"|"VERIFIED"|"REJECTED"|"EXPIRED";
export type PropertyType  = "HOUSE"|"APARTMENT"|"LAND"|"COMMERCIAL"|"VILLA"|"COMPOUND";
export type PropertyStatus= "DRAFT"|"PENDING_REVIEW"|"ACTIVE"|"UNDER_OFFER"|"SOLD"|"WITHDRAWN"|"SUSPENDED";
export type Currency      = "GMD"|"USD"|"GBP"|"EUR";
export type EscrowStatus  = "INITIATED"|"FUNDED"|"INSPECTING"|"APPROVED"|"DISPUTED"|"RELEASED"|"REFUNDED"|"CANCELLED";
export type OfferStatus   = "PENDING"|"ACCEPTED"|"REJECTED"|"COUNTERED"|"EXPIRED"|"WITHDRAWN";
export type DocumentType  = "TITLE_DEED"|"SURVEY_PLAN"|"BUILDING_PERMIT"|"PURCHASE_AGREEMENT"|"POWER_OF_ATTORNEY"|"IDENTITY_DOCUMENT"|"PROOF_OF_FUNDS"|"INSPECTION_REPORT"|"TAX_CLEARANCE"|"OTHER";

export interface ApiResponse<T = any> {
  success: boolean; data?: T; error?: string; code?: string; errors?: Record<string, string[]>;
}

export interface UserProfile {
  id: string; userId: string; firstName: string; lastName: string;
  avatarUrl?: string; bio?: string; city?: string; country?: string; languages: string[];
}
export interface User {
  id: string; email: string; phone?: string; role: UserRole;
  isEmailVerified: boolean; diasporaCountry?: string; preferredCurrency: Currency;
  profile?: UserProfile; kyc?: { status: KycStatus; verifiedAt?: Date }; createdAt: Date;
}

export interface ListingImage {
  id: string; url: string; thumbnailUrl?: string; caption?: string; isPrimary: boolean; order: number;
}
export interface ListingCard {
  id: string; slug: string; title: string; propertyType: PropertyType; status: PropertyStatus;
  price: number; currency: Currency; priceUsd?: number; region: string; area?: string;
  bedrooms?: number; bathrooms?: number; landSizesqm?: number;
  furnished: boolean; titleDeedAvailable: boolean; isNegotiable: boolean; isInstallment: boolean;
  images: ListingImage[]; createdAt: Date;
}
export interface Listing extends ListingCard {
  description: string; address: string; latitude?: number; longitude?: number;
  bathrooms?: number; toilets?: number; yearBuilt?: number; floors?: number;
  features: string[]; hasElectricity: boolean; hasWater: boolean; hasInternet: boolean; hasSecurity: boolean;
  diasporaHighlights: string[]; aiSummary?: string; viewCount: number; seller: User;
}

export interface EscrowAccount {
  id: string; referenceNumber: string; listingId: string; buyerId: string; sellerId: string;
  totalAmount: number; currency: Currency; status: EscrowStatus;
  platformFeePercent: number; platformFeeAmount?: number; sellerPayoutAmount?: number;
  milestones: any[]; inspectionDeadline?: Date; fundedAt?: Date; releasedAt?: Date;
  disputeReason?: string; listing: ListingCard; buyer: User; seller: User; createdAt: Date;
}
export interface Offer {
  id: string; listingId: string; buyerId: string; amount: number; currency: Currency;
  status: OfferStatus; message?: string; expiresAt: Date; listing: ListingCard; buyer: User; createdAt: Date;
}
export interface Notification {
  id: string; userId: string; type: "EMAIL"|"SMS"|"PUSH"|"IN_APP";
  status: "PENDING"|"SENT"|"DELIVERED"|"FAILED"|"READ";
  title: string; body: string; data?: Record<string, any>; readAt?: Date; createdAt: Date;
}

export const GAMBIA_REGIONS = [
  "Banjul","Kanifing","Kombo North","Kombo South","Kombo Central","Kombo East",
  "Brikama","Kerewan","Kuntaur","Georgetown","Janjanbureh","Basse",
] as const;

export const DIASPORA_COUNTRIES = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States",  flag: "🇺🇸" },
  { code: "SE", name: "Sweden",         flag: "🇸🇪" },
  { code: "DE", name: "Germany",        flag: "🇩🇪" },
  { code: "NO", name: "Norway",         flag: "🇳🇴" },
  { code: "DK", name: "Denmark",        flag: "🇩🇰" },
  { code: "NL", name: "Netherlands",    flag: "🇳🇱" },
  { code: "IT", name: "Italy",          flag: "🇮🇹" },
  { code: "SN", name: "Senegal",        flag: "🇸🇳" },
] as const;
