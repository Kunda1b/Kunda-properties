import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Handshake, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { offersApi, escrowApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  ACCEPTED:  "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-700",
  COUNTERED: "bg-blue-100 text-blue-700",
  EXPIRED:   "bg-gray-100 text-gray-500",
};

function OfferCard({ offer, isSeller }: { offer: any; isSeller: boolean }) {
  const qc = useQueryClient();
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMsg, setCounterMsg] = useState("");

  const respondMutation = useMutation({
    mutationFn: (payload: { action: string; counterAmount?: string; counterMessage?: string }) =>
      offersApi.respond(offer.id, payload),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "accept" ? "Offer accepted!" : vars.action === "reject" ? "Offer declined" : "Counter sent");
      qc.invalidateQueries({ queryKey: ["my-offers"] });
      setShowCounter(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const initEscrowMutation = useMutation({
    mutationFn: () => escrowApi.initiate({ listingId: offer.listingId, offerId: offer.id }),
    onSuccess: () => { toast.success("Escrow initiated!"); qc.invalidateQueries({ queryKey: ["my-escrows"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to initiate escrow"),
  });

  const img = offer.listing?.images?.[0];

  return (
    <div className={`bg-white rounded-xl border p-5 ${offer.status === "ACCEPTED" ? "border-green-200" : "border-gray-100"}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-kunda-50 flex-shrink-0 overflow-hidden">
          {img ? <img src={img.thumbnailUrl || img.url} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-2xl">🏠</span>}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/listings/${offer.listing?.slug || offer.listingId}`} className="font-semibold text-gray-900 hover:text-kunda-700 truncate block">
            {offer.listing?.title || "Property"}
          </Link>
          {!isSeller && (
            <p className="text-xs text-gray-400 mt-0.5">
              {offer.buyer?.profile?.firstName} {offer.buyer?.profile?.lastName}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-sm font-bold text-kunda-700">{formatPrice(Number(offer.amount), offer.currency)}</span>
            <span className={`badge text-xs ${STATUS_BADGE[offer.status] || "bg-gray-100 text-gray-600"}`}>
              {offer.status}
            </span>
            {offer.counterAmount && (
              <span className="text-xs text-blue-600">Counter: {formatPrice(Number(offer.counterAmount), offer.currency)}</span>
            )}
          </div>
          {offer.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">"{offer.message}"</p>}
          {offer.counterMessage && <p className="text-xs text-blue-600 mt-1 line-clamp-2">Counter note: "{offer.counterMessage}"</p>}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-400">{new Date(offer.createdAt).toLocaleDateString()}</p>
          {/* Buyer: initiate escrow if offer accepted */}
          {!isSeller && offer.status === "ACCEPTED" && (
            <button
              onClick={() => initEscrowMutation.mutate()}
              disabled={initEscrowMutation.isPending}
              className="mt-2 btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              {initEscrowMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Start Escrow
            </button>
          )}
        </div>
      </div>

      {/* Seller actions on pending offers */}
      {isSeller && offer.status === "PENDING" && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
          <button onClick={() => respondMutation.mutate({ action: "accept" })} disabled={respondMutation.isPending}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            {respondMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Accept
          </button>
          <button onClick={() => setShowCounter(!showCounter)}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
            Counter {showCounter ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={() => respondMutation.mutate({ action: "reject" })} disabled={respondMutation.isPending}
            className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">
            Decline
          </button>
        </div>
      )}

      {showCounter && (
        <div className="mt-3 bg-blue-50 rounded-lg p-4 space-y-2">
          <input type="number" placeholder={`Counter amount (${offer.currency})`} value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)} className="input-field text-sm" min="0.01" step="any" />
          {counterAmount && Number(counterAmount) <= 0 && (
            <p className="text-red-600 text-xs">Counter amount must be greater than zero</p>
          )}
          {counterAmount && Number(counterAmount) === Number(offer.amount) && (
            <p className="text-red-600 text-xs">Counter amount must differ from the original offer ({offer.currency} {Number(offer.amount).toLocaleString()})</p>
          )}
          <textarea placeholder="Optional message…" value={counterMsg} onChange={(e) => setCounterMsg(e.target.value)}
            rows={2} className="input-field text-sm resize-none" />
          <button
            onClick={() => {
              const num = Number(counterAmount);
              if (!counterAmount || isNaN(num) || num <= 0) return;
              if (num === Number(offer.amount)) return;
              respondMutation.mutate({ action: "counter", counterAmount, counterMessage: counterMsg });
            }}
            disabled={
              !counterAmount ||
              Number(counterAmount) <= 0 ||
              Number(counterAmount) === Number(offer.amount) ||
              respondMutation.isPending
            }
            className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
            {respondMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Send Counter
          </button>
        </div>
      )}
    </div>
  );
}

export default function OffersPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"buyer" | "seller">(user?.role === "SELLER" ? "seller" : "buyer");

  const { data, isLoading } = useQuery({
    queryKey: ["my-offers", tab],
    queryFn: () => offersApi.getMine({ role: tab }).then((r) => r.data.data),
    retry: 1,
  });

  const offers = data?.offers || [];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Offers</h1>

      <div className="flex gap-2 mb-6">
        {(["buyer", "seller"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium capitalize",
              tab === t ? "bg-kunda-700 text-white" : "bg-white border border-gray-200 text-gray-600")}>
            {t === "buyer" ? "Offers I Made" : "Received Offers"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      )}

      {!isLoading && offers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Handshake className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-500 text-sm">
            {tab === "buyer" ? "Browse properties and make an offer to get started." : "Offers on your listings will appear here."}
          </p>
          {tab === "buyer" && <Link href="/listings" className="btn-primary inline-flex mt-4 text-sm">Browse Properties</Link>}
        </div>
      )}

      <div className="space-y-3">
        {offers.map((offer: any) => (
          <OfferCard key={offer.id} offer={offer} isSeller={tab === "seller"} />
        ))}
      </div>
    </div>
  );
}
