"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { listingsApi, savedApi } from "@/lib/api";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { useAuthStore } from "@/lib/store/auth.store";

export function ListingsGrid({ searchParams }: { searchParams: Record<string,string|undefined> }) {
  const router = useRouter();
  const isAuth = useAuthStore((s) => !!s.user);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const page = Number(searchParams.page || 1);

  const { data, isLoading } = useQuery({
    queryKey: ["listings-search", { ...searchParams, page }],
    queryFn: () => listingsApi.search({ ...searchParams, page, limit: 12 }).then((r) => r.data.data),
  });

  useQuery({
    queryKey: ["saved-ids"], enabled: isAuth,
    queryFn: async () => { const res = await savedApi.getAll(); setSavedIds(new Set(res.data.data.map((s:any)=>s.listingId))); },
  });

  const toggleSave = useCallback(async (id: string) => {
    if (!isAuth) { router.push("/auth/login"); return; }
    const was = savedIds.has(id);
    setSavedIds((p) => { const n = new Set(p); was ? n.delete(id) : n.add(id); return n; });
    try { was ? await savedApi.unsave(id) : await savedApi.save(id); } catch {}
  }, [isAuth, savedIds, router]);

  if (isLoading) return <div className="grid md:grid-cols-3 gap-6">{[1,2,3,4,5,6].map((i)=><div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl"/>)}</div>;

  const listings = data?.listings || [];
  if (!listings.length) return <div className="text-center py-20"><p className="text-5xl mb-4">🏠</p><p className="text-gray-500">No listings found</p></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((l: any, i: number) => <PropertyCard key={l.id} listing={l} index={i} isSaved={savedIds.has(l.id)} onToggleSave={toggleSave} />)}
    </div>
  );
}
