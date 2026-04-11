"use client";

import Link from "next/link";
import Image from "next/image";
import type { Property } from "@/types/property";
import { useSavedListings } from "@/store/savedListings";
import { useHydrated } from "@/hooks/use-hydrated";
import CloudinaryImage from "@/components/ui/CloudinaryImage";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function typeIcon(type: string) {
  switch (type) {
    case "house": return "🏠";
    case "land": return "🌍";
    case "apartment": return "🏢";
    case "commercial": return "🏪";
    default: return "🏠";
  }
}

export default function PropertyCard({ property }: { property: Property }) {
  const hydrated = useHydrated();
  const { saved, toggle } = useSavedListings();
  const isSaved = hydrated && saved.some((savedProperty) => savedProperty.id === property.id);

  return (
    <Link
      href={`/listings/${property.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-kunda-border bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-kunda-forest-soft">
        {property.photos?.[0]?.publicId ? (
          <CloudinaryImage
            publicId={property.photos[0].publicId}
            alt={property.title}
            variant="card"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : property.imageUrl ? (
          <Image
            src={property.imageUrl}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-30">{typeIcon(property.type)}</span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Verified badge */}
        {property.verified && (
          <div className="absolute left-3 top-3">
            <span className="badge badge-green backdrop-blur-sm bg-white/90 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-kunda-forest">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              Verified
            </span>
          </div>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(property);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110"
          aria-label={isSaved ? "Unsave property" : "Save property"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "#0f6e56" : "none"}>
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              stroke={isSaved ? "#0f6e56" : "#627067"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Type pill */}
        <div className="absolute bottom-3 right-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-kunda-ink backdrop-blur-sm shadow-sm capitalize">
            {property.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 font-display text-lg font-semibold text-kunda-ink leading-snug group-hover:text-kunda-forest transition-colors duration-200">
          {property.title}
        </h3>
        <p className="mb-3 text-sm text-kunda-muted">{property.location}</p>

        <div className="mt-auto flex items-end justify-between border-t border-kunda-border/50 pt-3">
          <p className="text-lg font-bold text-kunda-forest">
            {formatPrice(property.price, property.currency)}
          </p>
          <div className="flex items-center gap-3 text-xs text-kunda-muted">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 7v11m0-4h18M21 7v11M3 14h18V9a2 2 0 00-2-2H5a2 2 0 00-2 2v5z" />
                </svg>
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1zM6 12V5a2 2 0 012-2h1" />
                </svg>
                {property.bathrooms}
              </span>
            )}
            {property.sizeSqm > 0 && (
              <span>{property.sizeSqm} m²</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
