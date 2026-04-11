import { z } from "zod";
import {
  listingSortOptions,
  propertyTypes,
  type ListingFilters,
} from "@kunda/types";

export const defaultListingFilters: ListingFilters = {
  bedrooms: "",
  query: "",
  region: "",
  sort: "recommended",
  type: "",
};

export const listingFiltersSchema = z.object({
  bedrooms: z.string().regex(/^\d*$/).catch(""),
  query: z.string().catch(""),
  region: z.string().catch(""),
  sort: z.enum(listingSortOptions).catch("recommended"),
  type: z.union([z.enum(propertyTypes), z.literal("")]).catch(""),
});

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function parseListingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ListingFilters {
  return listingFiltersSchema.parse({
    bedrooms: firstValue(searchParams.bedrooms),
    query: firstValue(searchParams.query) || firstValue(searchParams.q),
    region: firstValue(searchParams.region),
    sort: firstValue(searchParams.sort),
    type: firstValue(searchParams.type),
  });
}
