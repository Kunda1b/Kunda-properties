import { propertySeedData } from "@kunda/db";
import type { Property } from "@/types/property";

export const LISTINGS: Property[] = propertySeedData.map((listing) => ({
  id: listing.id,
  title: listing.title,
  description: listing.description,
  location: listing.location,
  region: listing.region,
  price: listing.price,
  currency: listing.currency,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  sizeSqm: listing.sizeSqm ?? listing.lotSizeSqm ?? 0,
  verified: listing.verified,
  photos: listing.gallery.map((url, index) => ({
    id: `${listing.id}-photo-${index + 1}`,
    url,
    publicId: `${listing.id}-photo-${index + 1}`,
    isPrimary: index === 0,
    order: index,
  })),
  type: listing.type as Property["type"],
  imageUrl: listing.gallery[0],
  agentName: listing.agent.name,
  agentPhone: listing.agent.phone,
  listedAt: listing.publishedAt,
}));

export function getListingById(id: string): Property | undefined {
  return LISTINGS.find((listing) => listing.id === id);
}
