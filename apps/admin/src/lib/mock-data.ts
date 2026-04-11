import type { EscrowTransaction, KYCRecord, ListingPreview } from "@kunda/types";

export type AdminMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "neutral" | "warning";
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export type KycQueueItem = KYCRecord & {
  applicant: string;
  country: string;
  assignedTo: string;
  riskBand: "Low" | "Medium" | "High";
};

export type ModerationListing = ListingPreview & {
  submittedBy: string;
  submittedAt: string;
  reviewNote: string;
};

export type EscrowWatchItem = EscrowTransaction & {
  buyerName: string;
  listingTitle: string;
};

export type DisputeCase = {
  id: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  amount: string;
  openedAt: string;
  reason: string;
  status: "Open" | "Needs review" | "Awaiting docs";
  nextAction: string;
};

export type ChartDatum = {
  label: string;
  value: number;
};

export const adminMetrics: AdminMetric[] = [
  { label: "Pending KYC", value: "18", delta: "+4 since yesterday", tone: "warning" },
  { label: "Listings to review", value: "26", delta: "6 priority items", tone: "neutral" },
  { label: "Open escrow cases", value: "11", delta: "2 disputes active", tone: "warning" },
  { label: "Funds protected", value: "GBP 214k", delta: "+12% this month", tone: "positive" },
];

export const activityFeed: ActivityItem[] = [
  {
    id: "activity-1",
    title: "Smile callback returned for KYC batch 12",
    detail: "7 profiles moved to manual review due to name mismatches.",
    time: "12 minutes ago",
  },
  {
    id: "activity-2",
    title: "Land title uploaded on Sanyang beachfront listing",
    detail: "Moderation now blocked only on seller proof-of-ownership.",
    time: "31 minutes ago",
  },
  {
    id: "activity-3",
    title: "Escrow payout released to seller",
    detail: "Transaction ESC-2031 completed after signed documents sync.",
    time: "1 hour ago",
  },
];

export const kycQueue: KycQueueItem[] = [
  {
    id: "kyc-1",
    userId: "user-1",
    applicant: "Awa Ceesay",
    country: "United Kingdom",
    assignedTo: "Fatou Jallow",
    riskBand: "High",
    documentType: "PASSPORT",
    documentNumber: "P1234501",
    issuingCountry: "GB",
    documentUrl: "kyc/awa/front.jpg",
    documentBackUrl: undefined,
    selfieUrl: "kyc/awa/selfie.jpg",
    smileJobId: "smile-job-101",
    amlReferenceId: "aml-101",
    provider: "Smile Identity",
    status: "SUBMITTED",
    documentCheckStatus: "REVIEW_REQUIRED",
    livenessStatus: "PASSED",
    amlStatus: "PENDING",
    reviewNote: "Passport OCR and account name diverge on one middle name.",
    rejectionReason: undefined,
    submittedAt: "2026-04-10T08:20:00.000Z",
    reviewedAt: undefined,
    lastCheckedAt: "2026-04-10T09:03:00.000Z",
  },
  {
    id: "kyc-2",
    userId: "user-2",
    applicant: "Mariama Bah",
    country: "United States",
    assignedTo: "Lamin Camara",
    riskBand: "Medium",
    documentType: "DRIVERS_LICENSE",
    documentNumber: "D998877",
    issuingCountry: "US",
    documentUrl: "kyc/mariama/front.jpg",
    documentBackUrl: "kyc/mariama/back.jpg",
    selfieUrl: "kyc/mariama/selfie.jpg",
    smileJobId: "smile-job-102",
    amlReferenceId: "aml-102",
    provider: "Smile Identity",
    status: "PENDING",
    documentCheckStatus: "PENDING",
    livenessStatus: "PENDING",
    amlStatus: "PENDING",
    reviewNote: "Queued for automated retry after provider timeout.",
    rejectionReason: undefined,
    submittedAt: "2026-04-10T06:10:00.000Z",
    reviewedAt: undefined,
    lastCheckedAt: "2026-04-10T06:12:00.000Z",
  },
  {
    id: "kyc-3",
    userId: "user-3",
    applicant: "Modou Sowe",
    country: "The Gambia",
    assignedTo: "Fatou Jallow",
    riskBand: "Low",
    documentType: "NATIONAL_ID",
    documentNumber: "GM-204-998",
    issuingCountry: "GM",
    documentUrl: "kyc/modou/front.jpg",
    documentBackUrl: "kyc/modou/back.jpg",
    selfieUrl: "kyc/modou/selfie.jpg",
    smileJobId: "smile-job-103",
    amlReferenceId: "aml-103",
    provider: "Smile Identity",
    status: "APPROVED",
    documentCheckStatus: "PASSED",
    livenessStatus: "PASSED",
    amlStatus: "PASSED",
    reviewNote: "Approved after manual title-holder cross-check.",
    rejectionReason: undefined,
    submittedAt: "2026-04-09T14:00:00.000Z",
    reviewedAt: "2026-04-10T07:15:00.000Z",
    lastCheckedAt: "2026-04-10T07:10:00.000Z",
  },
];

export const moderationListings: ModerationListing[] = [
  {
    id: "listing-1",
    title: "Kololi duplex with ocean-side terrace",
    location: "Kololi",
    region: "West Coast",
    price: 185000,
    currency: "GBP",
    bedrooms: 4,
    type: "HOUSE",
    status: "PENDING_REVIEW",
    verified: false,
    primaryPhoto: undefined,
    submittedBy: "Buba Jammeh",
    submittedAt: "2026-04-10T08:04:00.000Z",
    reviewNote: "Missing rear-elevation photo and title scan.",
  },
  {
    id: "listing-2",
    title: "Brufut serviced plots near coastal road",
    location: "Brufut",
    region: "West Coast",
    price: 52000,
    currency: "GBP",
    bedrooms: 0,
    type: "LAND",
    status: "PENDING_REVIEW",
    verified: true,
    primaryPhoto: undefined,
    submittedBy: "Haddy Sonko",
    submittedAt: "2026-04-10T07:41:00.000Z",
    reviewNote: "Ready for publish once survey reference is attached.",
  },
  {
    id: "listing-3",
    title: "Banjul office floor with generator backup",
    location: "Banjul",
    region: "Greater Banjul",
    price: 98000,
    currency: "GBP",
    bedrooms: 0,
    type: "COMMERCIAL",
    status: "REJECTED",
    verified: false,
    primaryPhoto: undefined,
    submittedBy: "Fatoumatta Jarju",
    submittedAt: "2026-04-09T15:20:00.000Z",
    reviewNote: "Listing copy duplicates another active unit.",
  },
];

export const escrowWatchlist: EscrowWatchItem[] = [
  {
    id: "escrow-1",
    listingId: "listing-1",
    buyerId: "buyer-1",
    buyerName: "Isatou Bojang",
    listingTitle: "Kololi duplex with ocean-side terrace",
    amountGBP: 185000,
    amountGMD: 16187500,
    platformFee: 2775,
    status: "FUNDED",
    fundingCurrency: "GBP",
    paymentProvider: "STRIPE",
    paymentMethod: "CARD",
    paymentStatus: "SUCCEEDED",
    stripePaymentId: "pi_001",
    providerPaymentId: "stripe-001",
    providerReference: "KUNDA-ESC-001",
    checkoutUrl: "https://checkout.stripe.com/pay/mock",
    createdAt: "2026-04-09T18:00:00.000Z",
    updatedAt: "2026-04-10T08:00:00.000Z",
    fundedAt: "2026-04-09T18:12:00.000Z",
    refundedAt: undefined,
  },
  {
    id: "escrow-2",
    listingId: "listing-4",
    buyerId: "buyer-2",
    buyerName: "Ousman Faye",
    listingTitle: "Sukuta family compound with split title",
    amountGBP: 74000,
    amountGMD: 6475000,
    platformFee: 1110,
    status: "DISPUTED",
    fundingCurrency: "EUR",
    paymentProvider: "STRIPE",
    paymentMethod: "CARD",
    paymentStatus: "REQUIRES_ACTION",
    stripePaymentId: "pi_002",
    providerPaymentId: "stripe-002",
    providerReference: "KUNDA-ESC-002",
    checkoutUrl: undefined,
    createdAt: "2026-04-08T11:00:00.000Z",
    updatedAt: "2026-04-10T09:15:00.000Z",
    fundedAt: "2026-04-08T11:14:00.000Z",
    refundedAt: undefined,
  },
];

export const disputeCases: DisputeCase[] = [
  {
    id: "dispute-1",
    listingTitle: "Sukuta family compound with split title",
    buyerName: "Ousman Faye",
    sellerName: "Maimuna Darboe",
    amount: "EUR 74,000",
    openedAt: "2026-04-10 09:15",
    reason: "Seller uploaded a revised title page after funding.",
    status: "Needs review",
    nextAction: "Validate document timeline and call both parties.",
  },
  {
    id: "dispute-2",
    listingTitle: "Tanji beach lot",
    buyerName: "Yusupha Sarr",
    sellerName: "Muhammed Jatta",
    amount: "USD 32,500",
    openedAt: "2026-04-09 17:40",
    reason: "Boundary coordinates conflict with survey attachment.",
    status: "Awaiting docs",
    nextAction: "Await updated GIS extract from registry liaison.",
  },
];

export const listingTrend: ChartDatum[] = [
  { label: "Mon", value: 9 },
  { label: "Tue", value: 12 },
  { label: "Wed", value: 10 },
  { label: "Thu", value: 15 },
  { label: "Fri", value: 18 },
];

export const enquiryTrend: ChartDatum[] = [
  { label: "Mon", value: 21 },
  { label: "Tue", value: 27 },
  { label: "Wed", value: 24 },
  { label: "Thu", value: 31 },
  { label: "Fri", value: 35 },
];

export const escrowValueTrend: ChartDatum[] = [
  { label: "Mon", value: 45 },
  { label: "Tue", value: 62 },
  { label: "Wed", value: 58 },
  { label: "Thu", value: 81 },
  { label: "Fri", value: 94 },
];
