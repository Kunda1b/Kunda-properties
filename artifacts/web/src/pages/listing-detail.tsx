import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MapPin, BedDouble, Bath, Maximize, Shield, ArrowLeft, Loader2, X, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listingsApi, offersApi } from "@/lib/api";
import { formatPrice, formatArea } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const CURRENCIES = ["GMD", "USD", "GBP", "EUR"] as const;

function MakeOfferModal({ listing, onClose }: { listing: any; onClose: () => void }) {
  const [amount, setAmount] = useState(listing.price);
  const [currency, setCurrency] = useState<string>(listing.currency);
  const [message, setMessage] = useState("");
  const [, navigate] = useLocation();

  const offerMutation = useMutation({
    mutationFn: () => offersApi.make({ listingId: listing.id, amount: Number(amount), currency, message }),
    onSuccess: () => {
      toast.success("Offer sent! The seller will respond within 7 days.");
      onClose();
      navigate("/dashboard/offers");
    },
    onError: (e: any) => {
      const code = e?.response?.data?.code;
      if (code === "KYC_REQUIRED") {
        toast.error("Identity verification required. Complete KYC first.");
        navigate("/dashboard/kyc");
      } else {
        toast.error(e?.response?.data?.error || "Failed to send offer");
      }
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-gray-900">Make an Offer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-kunda-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Asking price</p>
            <p className="font-bold text-kunda-700 text-lg">{formatPrice(Number(listing.price), listing.currency)}</p>
            <p className="text-xs text-gray-500 mt-1 truncate">{listing.title}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Offer</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              rows={3} className="input-field resize-none"
              placeholder="Introduce yourself and explain your offer…" />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>KYC verification is required to make an offer. If you haven't verified, you'll be redirected.</span>
          </div>
          <button
            onClick={() => offerMutation.mutate()}
            disabled={!amount || offerMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {offerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Send Offer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage({ id }: { id: string }) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getOne(id).then((r) => r.data.data),
    retry: 1,
  });

  const isSeller = user && data && user.id === data.sellerId;
  const isLoggedIn = !!user;
  const canMakeOffer = isLoggedIn && !isSeller && data?.status === "ACTIVE";

  const FEATURES = data ? [
    data.furnished && "Furnished",
    data.hasElectricity && "Electricity",
    data.hasWater && "Water/Borehole",
    data.hasInternet && "Internet Ready",
    data.hasSecurity && "Security",
    data.titleDeedAvailable && "Title Deed",
    data.isNegotiable && "Price Negotiable",
    data.isInstallment && "Installment Option",
    ...(data.features || []),
    ...(data.diasporaHighlights || []),
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {showOfferModal && data && <MakeOfferModal listing={data} onClose={() => setShowOfferModal(false)} />}
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/listings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-kunda-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        {isLoading && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
            <div className="h-72 bg-gray-100 rounded-xl mb-6" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
            <p className="text-5xl mb-4">🏚️</p>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Listing not found</h2>
            <p className="text-gray-500 mb-6">This property may have been removed or is no longer available.</p>
            <Link href="/listings" className="btn-primary inline-flex">Browse Properties</Link>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Image gallery */}
              {data.images?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="relative h-72 md:h-96 bg-gray-100">
                    <img src={data.images[imgIdx]?.url} alt={data.title} className="w-full h-full object-cover" />
                    {data.images.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {data.images.map((_: any, i: number) => (
                          <button key={i} onClick={() => setImgIdx(i)}
                            className={cn("w-2 h-2 rounded-full transition-colors", i === imgIdx ? "bg-white" : "bg-white/50")} />
                        ))}
                      </div>
                    )}
                  </div>
                  {data.images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto">
                      {data.images.map((img: any, i: number) => (
                        <button key={img.id} onClick={() => setImgIdx(i)}
                          className={cn("w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                            i === imgIdx ? "border-kunda-700" : "border-transparent")}>
                          <img src={img.thumbnailUrl || img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!data.images?.length && (
                <div className="bg-white rounded-2xl border border-gray-100 h-48 flex items-center justify-center">
                  <span className="text-6xl">🏠</span>
                </div>
              )}

              {/* Details */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge bg-kunda-100 text-kunda-700">
                    {data.propertyType?.charAt(0) + data.propertyType?.slice(1).toLowerCase()}
                  </span>
                  {data.titleDeedAvailable && (
                    <span className="badge bg-kunda-700 text-white flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Title Deed
                    </span>
                  )}
                  <span className={`badge ${data.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {data.status?.replace(/_/g, " ")}
                  </span>
                </div>

                <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
                <div className="flex items-center gap-1 text-gray-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{data.address ? `${data.address}, ` : ""}{data.region}</span>
                </div>

                {(data.bedrooms != null || data.bathrooms != null || data.landSizeSqm != null) && (
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                    {data.bedrooms != null && <span className="flex items-center gap-2"><BedDouble className="w-5 h-5 text-kunda-600" />{data.bedrooms} Bed</span>}
                    {data.bathrooms != null && <span className="flex items-center gap-2"><Bath className="w-5 h-5 text-kunda-600" />{data.bathrooms} Bath</span>}
                    {data.landSizeSqm != null && <span className="flex items-center gap-2"><Maximize className="w-5 h-5 text-kunda-600" />{formatArea(Number(data.landSizeSqm))}</span>}
                    {data.buildingSizeSqm != null && <span className="flex items-center gap-2"><Maximize className="w-5 h-5 text-kunda-400" />{formatArea(Number(data.buildingSizeSqm))} built</span>}
                  </div>
                )}

                {data.description && (
                  <div className="mb-6">
                    <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Description</h2>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{data.description}</p>
                  </div>
                )}

                {FEATURES.length > 0 && (
                  <div>
                    <h2 className="font-display text-lg font-bold text-gray-900 mb-3">Features</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {FEATURES.map((f: string) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-kunda-600 flex-shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <p className="text-2xl font-bold text-kunda-700 mb-1">{formatPrice(Number(data.price), data.currency)}</p>
                {data.isNegotiable && <p className="text-xs text-green-600 mb-4">Price negotiable</p>}

                {canMakeOffer && (
                  <button onClick={() => setShowOfferModal(true)} className="btn-primary w-full mb-3">
                    Make an Offer
                  </button>
                )}

                {!isLoggedIn && (
                  <Link href="/auth/login" className="btn-primary w-full block text-center mb-3">
                    Sign In to Make Offer
                  </Link>
                )}

                {isSeller && (
                  <div className="text-center py-3 bg-kunda-50 rounded-lg text-kunda-700 text-sm font-medium mb-3">
                    This is your listing
                  </div>
                )}

                {data.status === "UNDER_OFFER" && !isSeller && (
                  <div className="text-center py-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm font-medium mb-3">
                    Under offer — enquiries still welcome
                  </div>
                )}

                {/* Seller info */}
                {data.seller && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Listed by</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-kunda-700 flex items-center justify-center text-white text-sm font-bold">
                        {data.seller.profile?.firstName?.[0] || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {data.seller.profile?.firstName} {data.seller.profile?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">Verified Seller</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 text-kunda-600" />
                    <span>Secure escrow protects your purchase</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
