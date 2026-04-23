"use client";

import { Suspense, useCallback, useState } from "react";
import type React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PropertyCard from "@/components/listings/PropertyCard";
import { LISTINGS } from "@/lib/listings";
import { filterListings } from "@/lib/search";
import type { PropertyType } from "@/types/property";

const TYPE_FILTERS: { label: string; value: PropertyType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Houses", value: "house" },
  { label: "Land", value: "land" },
  { label: "Apartments", value: "apartment" },
  { label: "Commercial", value: "commercial" },
];

function ListingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQuery = searchParams.get("q") || "";
  const rawUrlType = searchParams.get("type") || "all";
  const urlType = TYPE_FILTERS.some((filter) => filter.value === rawUrlType)
    ? (rawUrlType as PropertyType | "all")
    : "all";

  const [localQuery, setLocalQuery] = useState(urlQuery);
  const [activeType, setActiveType] = useState<PropertyType | "all">(urlType);

  const updateURL = useCallback(
    (q: string, type: PropertyType | "all") => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type !== "all") params.set("type", type);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname],
  );

  const handleTypeChange = (type: PropertyType | "all") => {
    setActiveType(type);
    updateURL(localQuery, type);
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(event.target.value);
    updateURL(event.target.value, activeType);
  };

  const clearSearch = () => {
    setLocalQuery("");
    setActiveType("all");
    router.replace(pathname, { scroll: false });
  };

  const filtered = filterListings(LISTINGS, {
    q: localQuery,
    type: activeType,
  });

  const hasActiveSearch = localQuery.trim() || activeType !== "all";

  return (
    <>
      {/* Header */}
      <div className="border-b border-kunda-border bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 pb-6 pt-10">
          <h1 className="mb-1 font-display text-3xl font-semibold text-kunda-ink">
            Properties in The Gambia
          </h1>
          <p className="text-sm text-kunda-muted">
            Browse verified properties available for diaspora buyers
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Search + Filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kunda-muted"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={localQuery}
              onChange={handleQueryChange}
              placeholder="Search by location or keyword..."
              className="input-field max-w-md pl-10"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => {
                  setLocalQuery("");
                  updateURL("", activeType);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-kunda-muted transition-colors hover:bg-kunda-forest-soft hover:text-kunda-ink"
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleTypeChange(filter.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeType === filter.value
                    ? "border-kunda-forest bg-kunda-forest text-white shadow-sm"
                    : "border-kunda-border bg-white text-kunda-muted hover:border-kunda-forest/30 hover:text-kunda-ink"
                }`}
              >
                {filter.label}
              </button>
            ))}

            {hasActiveSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-full border border-dashed border-kunda-border px-4 py-2 text-sm text-kunda-muted transition-colors hover:border-kunda-forest/30 hover:text-kunda-ink"
              >
                Clear filters ×
              </button>
            )}
          </div>
        </div>

        {/* Search badge */}
        {urlQuery && (
          <div className="mb-5 flex items-center gap-2">
            <span className="text-sm text-kunda-muted">Results for</span>
            <span className="badge badge-green">{urlQuery}</span>
          </div>
        )}

        {/* Count */}
        <div className="mb-5">
          <p className="text-sm text-kunda-muted">
            {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"} found
          </p>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="surface-card rounded-2xl py-20 text-center">
            <div className="mb-4 text-4xl opacity-30">🔍</div>
            <p className="mb-3 text-sm text-kunda-muted">
              No properties match your search.
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="btn-ghost text-kunda-forest font-semibold"
            >
              Clear and show all listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded-lg bg-kunda-forest-soft" />
            <div className="h-4 w-48 rounded bg-kunda-forest-soft/50" />
            <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-kunda-forest-soft/30" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ListingsPageContent />
    </Suspense>
  );
}
