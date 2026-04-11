"use client";

import Link from "next/link";
import Image from "next/image";
import { useSavedListings } from "@/store/savedListings";
import { useHydrated } from "@/hooks/use-hydrated";
import { LISTINGS } from "@/lib/listings";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function SavedListingsPage() {
  const hydrated = useHydrated();
  const { saved, toggle } = useSavedListings();

  const savedListings = hydrated
    ? LISTINGS.filter((listing) =>
        saved.some((savedListing) => savedListing.id === listing.id),
      )
    : [];

  if (!hydrated) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-kunda-forest-soft/30" />
        ))}
      </div>
    );
  }

  if (savedListings.length === 0) {
    return (
      <div className="surface-card rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kunda-forest-soft">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-kunda-forest">
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mb-2 font-display text-xl font-semibold text-kunda-ink">
          No saved listings yet
        </h3>
        <p className="mb-6 text-sm text-kunda-muted">
          Tap the heart icon on any property to save it here for later.
        </p>
        <Link href="/listings" className="btn-primary">
          Browse properties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-kunda-muted">
        {savedListings.length} saved propert{savedListings.length !== 1 ? "ies" : "y"}
      </p>

      {savedListings.map((property) => (
        <div
          key={property.id}
          className="surface-card flex flex-col gap-4 rounded-2xl p-4 transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center"
        >
          {/* Thumbnail */}
          <Link
            href={`/listings/${property.id}`}
            className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-xl bg-kunda-forest-soft sm:w-36"
          >
            {property.imageUrl ? (
              <Image
                src={property.imageUrl}
                alt={property.title}
                fill
                className="object-cover"
                sizes="144px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">
                🏠
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="flex-1">
            <Link href={`/listings/${property.id}`}>
              <h3 className="font-display text-lg font-semibold text-kunda-ink hover:text-kunda-forest transition-colors">
                {property.title}
              </h3>
            </Link>
            <p className="mt-0.5 text-sm text-kunda-muted">{property.location}</p>
            <p className="mt-1 text-lg font-bold text-kunda-forest">
              {formatPrice(property.price, property.currency)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:flex-col">
            <Link
              href={`/listings/${property.id}`}
              className="btn-primary flex-1 justify-center text-xs sm:flex-none"
            >
              View
            </Link>
            <button
              onClick={() => toggle(property)}
              className="btn-ghost flex-1 justify-center text-xs text-red-400 hover:!text-red-600 sm:flex-none"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
