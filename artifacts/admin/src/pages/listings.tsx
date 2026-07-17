import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle, XCircle, MapPin, BadgeCheck, ShieldOff } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { listingsAdminApi } from "@/lib/api";
import { LISTING_STATUS_COLORS, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ListingsPage() {
  const [status, setStatus] = useState("PENDING_REVIEW");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", { status }],
    queryFn: () => listingsAdminApi.getAll({ status }).then((r) => r.data.data),
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => listingsAdminApi.approve(id),
    onSuccess: () => { toast.success("Listing approved"); qc.invalidateQueries({ queryKey: ["admin-listings"] }); },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => listingsAdminApi.reject(id),
    onSuccess: () => { toast.success("Listing rejected"); qc.invalidateQueries({ queryKey: ["admin-listings"] }); },
    onError: () => toast.error("Failed to reject"),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      listingsAdminApi.verify(id, { verified }),
    onSuccess: () => { toast.success("Listing verification updated"); qc.invalidateQueries({ queryKey: ["admin-listings"] }); },
    onError: () => toast.error("Failed to update verification"),
  });

  const listings = data?.listings || data || [];

  return (
    <div>
      <AdminHeader title="Listings" subtitle="Review and manage property listings" />
      <div className="flex flex-wrap gap-2 mb-6">
        {["PENDING_REVIEW", "ACTIVE", "DRAFT", "SOLD", "SUSPENDED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              status === s ? "bg-kunda-700 text-white border-kunda-700" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>}
        {!isLoading && listings.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No listings with status: {status.replace(/_/g, " ")}</p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {listings.map((listing: any) => (
            <div key={listing.id} className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-kunda-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {listing.images?.[0]
                  ? <img src={listing.images[0].thumbnailUrl || listing.images[0].url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl">🏠</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm truncate">{listing.title}</p>
                  {listing.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{listing.region}</span>
                </div>
                <p className="text-sm font-bold text-kunda-700 mt-1">{formatPrice(Number(listing.price), listing.currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${LISTING_STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-600"}`}>
                  {listing.status?.replace(/_/g, " ")}
                </span>
                {listing.status === "ACTIVE" && (
                  <button
                    onClick={() => verifyMutation.mutate({ id: listing.id, verified: !listing.isVerified })}
                    disabled={verifyMutation.isPending}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
                      listing.isVerified
                        ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
                        : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    }`}
                  >
                    {listing.isVerified ? (
                      <><ShieldOff className="w-3.5 h-3.5" /> Unverify</>
                    ) : (
                      <><BadgeCheck className="w-3.5 h-3.5" /> Verify</>
                    )}
                  </button>
                )}
                {listing.status === "PENDING_REVIEW" && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(listing.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 px-2.5 py-1.5 rounded-lg bg-green-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(listing.id)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-lg bg-red-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
