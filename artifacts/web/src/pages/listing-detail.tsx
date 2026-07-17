import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MapPin, BedDouble, Bath, Maximize, Shield, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { listingsApi } from "@/lib/api";
import { formatPrice, formatArea } from "@/lib/utils";

export default function ListingDetailPage({ id }: { id: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getOne(id).then((r) => r.data.data),
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8">
        <Link href="/listings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-kunda-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>

        {isLoading && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
            <div className="h-72 bg-gray-100 rounded-xl mb-6" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-5xl mb-4">🏚️</p>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Listing not found</h2>
            <p className="text-gray-500 mb-6">This property may have been removed or is no longer available.</p>
            <Link href="/listings" className="btn-primary inline-flex">Browse Properties</Link>
          </div>
        )}

        {data && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {data.images?.length > 0 && (
              <div className="h-80 md:h-96 overflow-hidden bg-gray-100">
                <img src={data.images[0].url} alt={data.title} className="w-full h-full object-cover" />
              </div>
            )}
            {!data.images?.length && (
              <div className="h-48 bg-kunda-50 flex items-center justify-center">
                <span className="text-6xl">🏠</span>
              </div>
            )}
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge bg-kunda-100 text-kunda-700">
                  {data.propertyType?.charAt(0) + data.propertyType?.slice(1).toLowerCase()}
                </span>
                {data.titleDeedAvailable && (
                  <span className="badge bg-kunda-700 text-white"><Shield className="w-3 h-3" /> Title Deed</span>
                )}
                <span className={`badge ${data.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {data.status}
                </span>
              </div>

              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
              <div className="flex items-center gap-1 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{data.address ? `${data.address}, ` : ""}{data.region}</span>
              </div>
              <p className="text-3xl font-bold text-kunda-700 mb-6">{formatPrice(Number(data.price), data.currency)}</p>

              {(data.bedrooms != null || data.bathrooms != null || data.landSizesqm != null) && (
                <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                  {data.bedrooms != null && <span className="flex items-center gap-2"><BedDouble className="w-5 h-5 text-kunda-600" />{data.bedrooms} Bedrooms</span>}
                  {data.bathrooms != null && <span className="flex items-center gap-2"><Bath className="w-5 h-5 text-kunda-600" />{data.bathrooms} Bathrooms</span>}
                  {data.landSizesqm != null && <span className="flex items-center gap-2"><Maximize className="w-5 h-5 text-kunda-600" />{formatArea(Number(data.landSizesqm))}</span>}
                </div>
              )}

              {data.description && (
                <div className="mb-6">
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{data.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
