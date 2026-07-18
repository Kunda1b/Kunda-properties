import { Link } from "wouter";
import { Heart, MapPin, BedDouble, Bath, Maximize, Shield, BadgeCheck } from "lucide-react";
import { cn, formatPrice, formatArea } from "@/lib/utils";

interface Props { listing: any; className?: string; index?: number; isSaved?: boolean; onToggleSave?: (id: string) => void; }

export function PropertyCard({ listing, className, isSaved, onToggleSave }: Props) {
  const img = listing.images?.[0];
  return (
    <div className={cn("property-card group", className)}>
      <Link href={`/listings/${listing.slug || listing.id}`}>
        <div className="relative h-56 overflow-hidden bg-gray-100">
          {img ? (
            <img
              src={img.thumbnailUrl || img.url}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-kunda-50">
              <span className="text-4xl">🏠</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="badge bg-white/90 text-gray-700 text-xs">
              {listing.propertyType?.charAt(0) + listing.propertyType?.slice(1).toLowerCase()}
            </span>
            {listing.isVerified && (
              <span className="badge bg-blue-600 text-white text-xs flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
            {listing.titleDeedAvailable && (
              <span className="badge bg-kunda-700 text-white text-xs"><Shield className="w-3 h-3" /> Title Deed</span>
            )}
          </div>
          {onToggleSave && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleSave(listing.id); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            >
              <Heart className={cn("w-4 h-4", isSaved ? "fill-red-500 text-red-500" : "text-gray-600")} />
            </button>
          )}
        </div>
        <div className="p-4">
          <p className="text-xl font-bold text-kunda-700 font-display">{formatPrice(Number(listing.price), listing.currency)}</p>
          <h3 className="font-semibold text-gray-900 leading-snug mb-2 mt-1 line-clamp-2">{listing.title}</h3>
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{listing.area ? `${listing.area}, ` : ""}{listing.region}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
            {listing.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{listing.bedrooms}</span>}
            {listing.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{listing.bathrooms}</span>}
            {listing.landSizeSqm != null && <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{formatArea(Number(listing.landSizeSqm))}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
}
