import type { Listing as SharedListing, ListingPhoto, PropertyListing as SharedPropertyListing } from "@kunda/types";

export type {
  Listing,
  ListingPhoto,
  ListingPreview,
  ListingSearchParams,
  ListingStatus,
  PropertyListing as SharedPropertyListing,
} from "@kunda/types";

export type PropertyListing = Omit<SharedPropertyListing, "type"> & {
  type: Lowercase<SharedPropertyListing["type"]>;
};

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
