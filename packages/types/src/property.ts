export const propertyTypes = [
  "house",
  "apartment",
  "land",
  "commercial",
] as const;

export const listingSortOptions = [
  "recommended",
  "price-asc",
  "price-desc",
  "newest",
] as const;

type LegacyPropertyType = (typeof propertyTypes)[number];
export type ListingSortOption = (typeof listingSortOptions)[number];

export type AgentProfile = {
  agency: string;
  languages: string[];
  name: string;
  phone: string;
  responseTime: string;
  title: string;
  whatsapp: string;
  yearsExperience: number;
};

export type PropertyListing = {
  agent: AgentProfile;
  bathrooms: number;
  bedrooms: number;
  completion: string;
  currency: "USD";
  description: string;
  enquiryCount: number;
  escrowReady: boolean;
  featured: boolean;
  gallery: string[];
  headline: string;
  highlights: string[];
  id: string;
  location: string;
  lotSizeSqm?: number;
  price: number;
  publishedAt: string;
  region: string;
  sizeLabel: string;
  sizeSqm?: number;
  slug: string;
  summary: string;
  title: string;
  type: LegacyPropertyType;
  verified: boolean;
};

export type ListingFilters = {
  bedrooms: string;
  query: string;
  region: string;
  sort: ListingSortOption;
  type: LegacyPropertyType | "";
};

export type EnquiryRecord = {
  createdAt: string;
  email: string;
  message: string;
  name: string;
  phone: string;
  propertyId: string;
  propertyTitle: string;
};
