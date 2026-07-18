import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { listingsApi, savedApi } from "@/lib/api";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAuthStore } from "@/lib/store/auth.store";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ListingsGrid({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [, navigate] = useLocation();
  const isAuth = useAuthStore((s) => !!s.user);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const page = Number(searchParams.page || 1);

  const { data, isLoading } = useQuery({
    queryKey: ["listings-search", { ...searchParams, page }],
    queryFn: () => listingsApi.search({ ...searchParams, page, limit: 12 }).then((r) => r.data.data),
    retry: 1,
  });

  useQuery({
    queryKey: ["saved-ids"],
    enabled: isAuth,
    queryFn: async () => {
      const res = await savedApi.getAll();
      setSavedIds(new Set(res.data.data.map((s: any) => s.listingId)));
    },
  });

  const toggleSave = useCallback(async (id: string) => {
    if (!isAuth) { navigate("/auth/login"); return; }
    const was = savedIds.has(id);
    setSavedIds((p) => { const n = new Set(p); was ? n.delete(id) : n.add(id); return n; });
    try { was ? await savedApi.unsave(id) : await savedApi.save(id); } catch {}
  }, [isAuth, savedIds, navigate]);

  if (isLoading) return (
    <div className="grid md:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
    </div>
  );

  const listings = data?.listings || [];
  if (!listings.length) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🏠</p>
      <p className="text-gray-500">No listings found</p>
    </div>
  );

  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    navigate(`/listings?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((l: any, i: number) => (
          <PropertyCard key={l.id} listing={l} index={i} isSaved={savedIds.has(l.id)} onToggleSave={toggleSave} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) { p = i + 1; }
              else if (currentPage <= 4) { p = i + 1; }
              else if (currentPage >= totalPages - 3) { p = totalPages - 6 + i; }
              else { p = currentPage - 3 + i; }
              return (
                <button key={p} onClick={() => goToPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? "bg-kunda-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  {p}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {data?.total != null && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Showing {listings.length} of {data.total} {data.total === 1 ? "property" : "properties"}
        </p>
      )}
    </div>
  );
}
