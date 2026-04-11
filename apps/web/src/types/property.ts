import type { Listing as SharedListing, ListingPhoto } from "@kunda/types";

export type {
  Listing,
  ListingPhoto,
  ListingPreview,
  ListingSearchParams,
  ListingStatus,
} from "@kunda/types";

export type PropertyType = Lowercase<SharedListing["type"]>;

export type Property = Pick<
  SharedListing,
  | "id"
  | "title"
  | "description"
  | "location"
  | "region"
  | "price"
  | "currency"
  | "bedrooms"
  | "bathrooms"
  | "sizeSqm"
  | "verified"
  | "photos"
> & {
  type: PropertyType;
  imageUrl?: string;
  agentName: string;
  agentPhone: string;
  listedAt: string;
};

export type PropertyPhoto = ListingPhoto;
