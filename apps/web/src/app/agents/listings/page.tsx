"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type AgentListing = {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  type: string;
  status: string;
  verified: boolean;
  createdAt: string;
  photos: { url: string; isPrimary: boolean }[];
  _count: { enquiries: number };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  DRAFT: { label: "Draft", bg: "#F1EFE8", color: "#444441" },
  PENDING_REVIEW: { label: "Under review", bg: "#FAEEDA", color: "#633806" },
  PUBLISHED: { label: "Published", bg: "#E1F5EE", color: "#085041" },
  REJECTED: { label: "Rejected", bg: "#FAECE7", color: "#712B13" },
  SOLD: { label: "Sold", bg: "#E6F1FB", color: "#0C447C" },
};

const FALLBACK_STATUS = { label: "Draft", bg: "#F1EFE8", color: "#444441" };

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AgentListingsPage() {
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<{ data: AgentListing[] }>("/api/listings/my")
      .then((res) => setListings(res.data))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load listings",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "var(--kunda-green-light)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              stroke="#0F6E56"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="9 22 9 12 15 12 15 22"
              stroke="#0F6E56"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          No listings yet
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Add your first property listing to get started.
        </p>
        <Link
          href="/agents/listings/new"
          className="inline-block px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--kunda-green)" }}
        >
          Add first listing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => {
        const status = STATUS_CONFIG[listing.status] ?? FALLBACK_STATUS;
        const primaryPhoto = listing.photos.find((p) => p.isPrimary);

        return (
          <div
            key={listing.id}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden flex"
          >
            <div
              className="w-24 h-24 flex-shrink-0"
              style={{ backgroundColor: "var(--kunda-green-light)" }}
            >
              {primaryPhoto ? (
                <img
                  src={primaryPhoto.url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl opacity-20">🏠</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {listing.title}
                  </h3>
                  <span
                    className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                      fontSize: "10px",
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {listing.location}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="font-medium text-gray-900">
                    {formatPrice(listing.price, listing.currency)}
                  </span>
                  <span>·</span>
                  <span>
                    {listing._count.enquiries} enquir
                    {listing._count.enquiries === 1 ? "y" : "ies"}
                  </span>
                  <span>·</span>
                  <span>Listed {formatDate(listing.createdAt)}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/listings/${listing.id}`}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  View
                </Link>
                <Link
                  href={`/agents/listings/${listing.id}/edit`}
                  className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors"
                  style={{
                    borderColor: "var(--kunda-green)",
                    color: "var(--kunda-green)",
                  }}
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
