import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { listingsApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  DRAFT:          "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  ACTIVE:         "bg-green-100 text-green-700",
  UNDER_OFFER:    "bg-blue-100 text-blue-700",
  SOLD:           "bg-kunda-100 text-kunda-700",
  WITHDRAWN:      "bg-red-100 text-red-700",
  SUSPENDED:      "bg-red-100 text-red-700",
};

export default function MyListingsPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => listingsApi.submit(id),
    onSuccess: () => { toast.success("Submitted for review"); qc.invalidateQueries({ queryKey: ["my-listings"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to submit"),
  });

  const listings = data?.listings || [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Listings</h1>
        <Link href="/dashboard/listings/new" className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Listing
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-500 text-sm mb-6">Add your first property to start selling on Kunda.</p>
          <Link href="/dashboard/listings/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Your First Listing
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {listings.map((listing: any) => (
          <div key={listing.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-kunda-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {listing.images?.[0] ? (
                <img src={listing.images[0].thumbnailUrl || listing.images[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🏠</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
              <p className="text-sm text-gray-500">{listing.region}</p>
              <p className="text-sm font-bold text-kunda-700 mt-1">{formatPrice(Number(listing.price), listing.currency)}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={cn("badge text-xs", STATUS_BADGE[listing.status] || "bg-gray-100 text-gray-600")}>
                {listing.status?.replace(/_/g, " ")}
              </span>
              {listing.status === "DRAFT" && (
                <button
                  onClick={() => submitMutation.mutate(listing.id)}
                  disabled={submitMutation.isPending}
                  className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit"}
                </button>
              )}
              <Link href={`/listings/${listing.slug || listing.id}`} className="btn-outline text-xs py-1.5 px-3">View</Link>
              <Link href={`/dashboard/listings/${listing.id}/edit`} className="text-xs text-gray-500 hover:text-kunda-700 px-2">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
