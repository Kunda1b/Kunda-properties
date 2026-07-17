"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Star, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatPrice, LISTING_STATUS_BADGES, cn } from "@/lib/utils";

export default function AdminListingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending"|"all">("pending");
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", tab], queryFn: () => (tab==="pending" ? adminApi.getPendingListings() : adminApi.getAllListings()).then((r) => r.data.data),
  });
  const mutOpts = (msg: string) => ({ onSuccess: () => { toast.success(msg); setSelected(null); qc.invalidateQueries({ queryKey: ["admin-listings"] }); } });
  const approve = useMutation({ mutationFn: (id: string) => adminApi.approveListing(id), ...mutOpts("Listing published ✅") });
  const reject  = useMutation({ mutationFn: (id: string) => adminApi.rejectListing(id), ...mutOpts("Returned to draft") });
  const suspend = useMutation({ mutationFn: (id: string) => adminApi.suspendListing(id), ...mutOpts("Listing suspended") });
  const feature = useMutation({ mutationFn: (id: string) => adminApi.featureListing(id), ...mutOpts("Listing featured ⭐") });

  const listings = data?.listings || [];

  return (
    <div>
      <AdminHeader title="Listings" subtitle="Moderation & management" />
      <div className="p-6 flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-5">
            {(["pending","all"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab===t?"bg-kunda-700 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{t==="pending"?"Pending Review":"All Listings"}</button>)}
          </div>
          <div className="space-y-3">
            {isLoading ? Array.from({length:6}).map((_,i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-20"/>)
            : listings.length === 0 ? <div className="bg-white rounded-xl border border-gray-100 p-16 text-center"><CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3"/><p className="text-gray-500">No listings pending review</p></div>
            : listings.map((listing: any) => {
              const img = listing.images?.[0];
              return (
                <div key={listing.id} className={cn("bg-white rounded-xl border p-4 flex items-center gap-4 cursor-pointer", selected?.id===listing.id ? "border-kunda-400 bg-kunda-50" : "border-gray-100")} onClick={() => setSelected(selected?.id===listing.id?null:listing)}>
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">{img ? <img src={img.thumbnailUrl||img.url} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 truncate">{listing.title}</p><p className="text-gray-500 text-sm">{listing.region} · {listing.propertyType}</p><p className="text-kunda-700 font-bold text-sm mt-0.5">{formatPrice(Number(listing.price), listing.currency)}</p></div>
                  <span className={LISTING_STATUS_BADGES[listing.status] || "badge-gray"}>{listing.status?.replace("_"," ")}</span>
                  {listing.status === "PENDING_REVIEW" && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => approve.mutate(listing.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><CheckCircle className="w-5 h-5"/></button>
                      <button onClick={() => reject.mutate(listing.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><XCircle className="w-5 h-5"/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {selected && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900 text-sm">Actions</h3><button onClick={() => setSelected(null)} className="text-gray-400">×</button></div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{selected.title}</p>
              <p className="text-kunda-700 font-bold mb-4">{formatPrice(Number(selected.price), selected.currency)}</p>
              <div className="space-y-2">
                {selected.status === "PENDING_REVIEW" && <button onClick={() => approve.mutate(selected.id)} className="btn-primary w-full flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/> Approve & Publish</button>}
                {selected.status === "ACTIVE" && <button onClick={() => feature.mutate(selected.id)} className="btn-outline w-full flex items-center justify-center gap-2 border-sand-400 text-sand-500"><Star className="w-4 h-4"/> Feature</button>}
                <button onClick={() => suspend.mutate(selected.id)} className="btn-danger w-full flex items-center justify-center gap-2"><Ban className="w-4 h-4"/> Suspend</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
