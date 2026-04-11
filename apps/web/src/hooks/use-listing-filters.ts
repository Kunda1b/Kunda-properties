"use client";

import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";
import {
  defaultListingFilters,
  filterProperties,
} from "@/lib/search";
import type { ListingFilters, PropertyListing } from "@kunda/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UseListingFiltersArgs = {
  initialFilters?: ListingFilters;
  properties: PropertyListing[];
};

export function useListingFilters({
  initialFilters = defaultListingFilters,
  properties,
}: UseListingFiltersArgs) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialFilters.query);
  const [region, setRegion] = useState(initialFilters.region);
  const [type, setType] = useState(initialFilters.type);
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms);
  const [sort, setSort] = useState(initialFilters.sort);
  const [isPending, startTransition] = useTransition();

  const deferredQuery = useDeferredValue(query);
  const searchParamsKey = searchParams.toString();

  const pushFiltersToUrl = useEffectEvent((nextFilters: ListingFilters) => {
    const params = new URLSearchParams();

    if (nextFilters.query.trim()) {
      params.set("query", nextFilters.query.trim());
    }

    if (nextFilters.region) {
      params.set("region", nextFilters.region);
    }

    if (nextFilters.type) {
      params.set("type", nextFilters.type);
    }

    if (nextFilters.bedrooms) {
      params.set("bedrooms", nextFilters.bedrooms);
    }

    if (nextFilters.sort !== "recommended") {
      params.set("sort", nextFilters.sort);
    }

    const nextQueryString = params.toString();

    if (nextQueryString === searchParamsKey) {
      return;
    }

    startTransition(() => {
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
        scroll: false,
      });
    });
  });

  useEffect(() => {
    pushFiltersToUrl({
      bedrooms,
      query: deferredQuery,
      region,
      sort,
      type,
    });
  }, [bedrooms, deferredQuery, region, sort, type]);

  const activeFilters: ListingFilters = {
    bedrooms,
    query: deferredQuery,
    region,
    sort,
    type,
  };

  return {
    activeFilters,
    clearFilters() {
      setQuery("");
      setRegion("");
      setType("");
      setBedrooms("");
      setSort("recommended");
    },
    filteredProperties: filterProperties(properties, activeFilters),
    isPending,
    setBedrooms,
    setQuery,
    setRegion,
    setSort,
    setType,
  };
}
