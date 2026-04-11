import { z } from "zod";

const PROPERTY_TYPES = ["HOUSE", "LAND", "APARTMENT", "COMMERCIAL"] as const;
const CURRENCIES = ["GBP", "EUR", "USD", "GMD"] as const;
const queryBooleanSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const createListingSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(150, "Title is too long"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description is too long"),
  location: z.string().min(3, "Location is required"),
  region: z.string().min(2, "Region is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(10_000_000, "Price seems too high - please check"),
  currency: z.enum(CURRENCIES).default("GBP"),
  bedrooms: z.number().int().min(0).max(50).default(0),
  bathrooms: z.number().int().min(0).max(50).default(0),
  sizeSqm: z.number().int().min(0).max(100_000).default(0),
  type: z.enum(PROPERTY_TYPES),
});

export const updateListingSchema = createListingSchema.partial();

export const listingSearchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  region: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().int().optional(),
  verified: queryBooleanSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingSearchInput = z.infer<typeof listingSearchSchema>;
