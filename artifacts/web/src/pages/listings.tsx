import { useState, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingsGrid } from "@/components/listings/ListingsGrid";
import { MapboxMap } from "@/components/map/MapboxMap";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "@/lib/api";
import { MapIcon, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ListingsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [view, setView] = useState<"grid" | "map">("grid");

  const { data: mapData } = useQuery({
    queryKey: ["listings-for-map", searchParams],
    queryFn: () => listingsApi.search({ ...searchParams, limit: 50 }).then((r) => r.data.data),
    enabled: view === "map",
  });

  const mapLocations = (mapData?.listings || []).filter((l: any) => l.latitude && l.longitude).map((l: any) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    latitude: Number(l.latitude),
    longitude: Number(l.longitude),
    price: l.price,
    currency: l.currency,
    image: l.images?.[0]?.thumbnailUrl,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold text-gray-900">Properties in The Gambia</h1>
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

          <Suspense fallback={
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
          }>
            {view === "grid" && <ListingsGrid searchParams={searchParams} />}
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
