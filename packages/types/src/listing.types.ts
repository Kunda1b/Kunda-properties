export type PropertyType = "HOUSE" | "LAND" | "APARTMENT" | "COMMERCIAL";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "SOLD";

export type ListingPhoto = {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
  order: number;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  region: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: number;
  type: PropertyType;
  status: ListingStatus;
  verified: boolean;
  agentId: string;
  photos: ListingPhoto[];
  createdAt: string;
  updatedAt: string;
};

export type ListingPreview = Pick<
  Listing,
  | "id"
  | "title"
  | "location"
  | "region"
  | "price"
  | "currency"
  | "bedrooms"
  | "type"
  | "status"
  | "verified"
> & {
  primaryPhoto?: string;
};

export type ListingSearchParams = {
  q?: string;
  type?: PropertyType;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  verified?: boolean;
  page?: number;
  limit?: number;
};
