import type { ListingFilters, PropertyListing } from "@kunda/types";
import type { Property, PropertyType } from "@/types/property";

export { propertyTypes } from "@kunda/types";

export type SearchParams = {
  q?: string;
  type?: PropertyType | "all";
  minPrice?: number;
  maxPrice?: number;
};

export const defaultListingFilters: ListingFilters = {
  bedrooms: "",
  query: "",
  region: "",
  sort: "recommended",
  type: "",
};

export function parseListingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ListingFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];

    if (Array.isArray(value)) {
      return value[0] ?? "";
    }

    return value ?? "";
  };

  const sort = getValue("sort");

  return {
    bedrooms: getValue("bedrooms"),
    query: getValue("query") || getValue("q"),
    region: getValue("region"),
    sort:
      sort === "price-asc" ||
      sort === "price-desc" ||
      sort === "newest" ||
      sort === "recommended"
        ? sort
        : "recommended",
    type: getValue("type") as ListingFilters["type"],
  };
}

export function filterProperties(
  listings: PropertyListing[],
  filters: ListingFilters,
) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const minimumBedrooms = Number(filters.bedrooms || 0);

  const filtered = listings.filter((property) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [
        property.title,
        property.location,
        property.region,
        property.summary,
        property.headline,
        ...property.highlights,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    const matchesRegion =
      filters.region.length === 0 || property.region === filters.region;
    const matchesType =
      filters.type.length === 0 || property.type === filters.type;
    const matchesBedrooms =
      minimumBedrooms === 0 || property.bedrooms >= minimumBedrooms;

    return matchesQuery && matchesRegion && matchesType && matchesBedrooms;
  });

  return filtered.sort((left, right) => {
    if (filters.sort === "price-asc") {
      return left.price - right.price;
    }

    if (filters.sort === "price-desc") {
      return right.price - left.price;
    }

    if (filters.sort === "newest") {
      return (
        new Date(right.publishedAt).getTime() -
        new Date(left.publishedAt).getTime()
      );
    }

    const leftScore =
      (left.featured ? 2 : 0) + (left.escrowReady ? 1 : 0) + left.enquiryCount;
    const rightScore =
      (right.featured ? 2 : 0) +
      (right.escrowReady ? 1 : 0) +
      right.enquiryCount;

    return rightScore - leftScore;
  });
}

export function filterListings(
  listings: Property[],
  params: SearchParams,
): Property[] {
  let results = [...listings];

  if (params.q && params.q.trim().length > 0) {
    const query = params.q.trim().toLowerCase();
    results = results.filter(
      (property) =>
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query) ||
        property.region.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query),
    );
  }

  if (params.type && params.type !== "all") {
    results = results.filter((property) => property.type === params.type);
  }

  if (params.minPrice !== undefined) {
    results = results.filter((property) => property.price >= params.minPrice!);
  }

  if (params.maxPrice !== undefined) {
    results = results.filter((property) => property.price <= params.maxPrice!);
  }

  return results;
}
