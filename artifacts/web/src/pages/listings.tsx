import { useState, Suspense } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingsGrid } from "@/components/listings/ListingsGrid";
import { MapboxMap } from "@/components/map/MapboxMap";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "@/lib/api";
import { MapIcon, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = ["All", "HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "VILLA", "COMPOUND"] as const;
const BEDROOM_OPTIONS = [
  { label: "Any", value: "" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4+", value: "4" },
];
const REGIONS = ["All", "Banjul", "Kanifing", "Brikama", "Bakau", "Serrekunda", "Coastal", "Upper River", "Other"];

// Sort presets mapped to backend sortBy + sortOrder query params
const SORT_OPTIONS = [
  { label: "Newest",    value: "newest",     sortBy: "created_at", sortOrder: "desc" },
  { label: "Oldest",    value: "oldest",     sortBy: "created_at", sortOrder: "asc"  },
  { label: "Price ↑",  value: "price_asc",  sortBy: "price",      sortOrder: "asc"  },
  { label: "Price ↓",  value: "price_desc", sortBy: "price",      sortOrder: "desc" },
] as const;

/** Convert frontend URL params into backend query params the search API accepts. */
function buildApiParams(urlParams: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};

  const { propertyType, bedrooms, minPrice, maxPrice, region, sort, page } = urlParams;

  if (propertyType && propertyType !== "All") out.propertyType = propertyType;
  if (bedrooms) out.bedrooms = bedrooms; // backend expects exact bedroom count
  if (minPrice) out.minPrice = minPrice;
  if (maxPrice) out.maxPrice = maxPrice;
  if (region && region !== "All") out.region = region;

  // Map sort preset → sortBy + sortOrder that the backend understands
  const preset = SORT_OPTIONS.find((o) => o.value === sort);
  if (preset) {
    out.sortBy = preset.sortBy;
    out.sortOrder = preset.sortOrder;
  }

  // Always pass page so ListingsGrid pagination works correctly
  if (page && page !== "1") out.page = page;

  return out;
}

export default function ListingsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"grid" | "map">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Read active filter values from URL params (frontend keys)
  const propertyType = searchParams.propertyType || "All";
  const bedrooms     = searchParams.bedrooms     || "";
  const minPrice     = searchParams.minPrice     || "";
  const maxPrice     = searchParams.maxPrice     || "";
  const region       = searchParams.region       || "All";
  const sort         = searchParams.sort         || "newest";

  const hasActiveFilters =
    (propertyType && propertyType !== "All") ||
    bedrooms || minPrice || maxPrice ||
    (region && region !== "All") ||
    (sort && sort !== "newest");

  /** Build a new URL preserving existing params + overrides, then navigate. */
  function updateFilter(key: string, value: string) {
    const base: Record<string, string> = {};
    if (propertyType && propertyType !== "All") base.propertyType = propertyType;
    if (bedrooms) base.bedrooms = bedrooms;
    if (minPrice)  base.minPrice  = minPrice;
    if (maxPrice)  base.maxPrice  = maxPrice;
    if (region && region !== "All") base.region = region;
    if (sort && sort !== "newest") base.sort = sort;

    const merged = { ...base, [key]: value };
    // Remove empty / "All" / "newest" values to keep URL clean
    Object.entries(merged).forEach(([k, v]) => {
      if (!v || v === "All" || (k === "sort" && v === "newest") || (k === "bedrooms" && !v))
        delete merged[k];
    });
    // Reset to page 1 whenever a filter changes
    delete merged.page;

    const qs = new URLSearchParams(merged).toString();
    navigate("/listings" + (qs ? `?${qs}` : ""));
  }

  function clearFilters() {
    navigate("/listings");
  }

  // Build backend API params from current URL state
  const apiParams = buildApiParams({ propertyType, bedrooms, minPrice, maxPrice, region, sort, page: searchParams.page });

  // Lightweight count query for the result badge
  const { data: countData } = useQuery({
    queryKey: ["listings-count", apiParams],
    queryFn: () => listingsApi.search({ ...apiParams, limit: "1" }).then((r) => r.data.data),
    staleTime: 30_000,
  });
  const totalCount: number | null = countData?.total ?? null;

  // Map data (only fetched when map is active)
  const { data: mapData } = useQuery({
    queryKey: ["listings-for-map", apiParams],
    queryFn: () => listingsApi.search({ ...apiParams, limit: "50" }).then((r) => r.data.data),
    enabled: view === "map",
  });
  const mapLocations = (mapData?.listings || [])
    .filter((l: any) => l.latitude && l.longitude && !isNaN(Number(l.latitude)) && !isNaN(Number(l.longitude)))
    .map((l: any) => ({
      id: l.id, title: l.title, slug: l.slug,
      latitude: Number(l.latitude), longitude: Number(l.longitude),
      price: l.price, currency: l.currency,
      image: l.images?.[0]?.thumbnailUrl,
    }));

  // ── Filter bar component (shared between desktop + mobile) ─────────────────
  function FilterBar({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className={cn("flex flex-wrap gap-3 items-center", mobile && "flex-col items-stretch")}>
        {/* Property type */}
        <div className="flex gap-1.5 flex-wrap">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => updateFilter("propertyType", t)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
                propertyType === t
                  ? "bg-kunda-700 text-white border-kunda-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-kunda-300",
              )}
            >
              {t === "All" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden md:block" />

        {/* Bedrooms */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 whitespace-nowrap">Beds:</span>
          <div className="flex gap-1">
            {BEDROOM_OPTIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => updateFilter("bedrooms", o.value)}
                className={cn(
                  "w-8 h-7 text-xs font-medium rounded border transition-colors",
                  bedrooms === o.value
                    ? "bg-sand-400 text-white border-sand-400"
                    : "bg-white text-gray-600 border-gray-200 hover:border-sand-300",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-gray-200 hidden md:block" />

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 whitespace-nowrap">GMD:</span>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-24 h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-kunda-400"
          />
          <span className="text-gray-300 text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-24 h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-kunda-400"
          />
        </div>

        <div className="w-px h-5 bg-gray-200 hidden md:block" />

        {/* Region */}
        <select
          value={region}
          onChange={(e) => updateFilter("region", e.target.value)}
          className="h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-kunda-400 bg-white"
        >
          {REGIONS.map((r) => <option key={r} value={r}>{r === "All" ? "All Regions" : r}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-kunda-400 bg-white"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-gray-900">Properties in The Gambia</h1>
              {totalCount != null && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalCount.toLocaleString()} {totalCount === 1 ? "property" : "properties"}
                </span>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters((p) => !p)}
                className={cn(
                  "md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                  showMobileFilters ? "bg-kunda-700 text-white border-kunda-700" : "bg-white text-gray-600 border-gray-200",
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters {hasActiveFilters && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />}
              </button>
              {/* Grid / Map toggle */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                <button
                  onClick={() => setView("grid")}
                  className={cn("p-1.5 rounded-md transition-colors",
                    view === "grid" ? "bg-kunda-700 text-white" : "text-gray-400 hover:text-gray-600")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("map")}
                  className={cn("p-1.5 rounded-md transition-colors",
                    view === "map" ? "bg-kunda-700 text-white" : "text-gray-400 hover:text-gray-600")}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop filter bar */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 px-4 py-3 mb-6">
            <FilterBar />
          </div>

          {/* Mobile filter panel */}
          {showMobileFilters && (
            <div className="md:hidden bg-white rounded-xl border border-gray-200 px-4 py-4 mb-6">
              <FilterBar mobile />
            </div>
          )}

          {/* Map view */}
          {view === "map" && (
            <div className="mb-6">
              <MapboxMap
                locations={mapLocations}
                height="500px"
                className="rounded-xl border border-gray-200"
              />
              {mapLocations.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  No properties with map coordinates found for this search
                </p>
              )}
            </div>
          )}

          {/* Grid view — ListingsGrid reads searchParams.page for pagination; pass full apiParams */}
          <Suspense fallback={
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
          }>
            {view === "grid" && <ListingsGrid searchParams={apiParams} />}
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
