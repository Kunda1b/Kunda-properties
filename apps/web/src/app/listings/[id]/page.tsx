"use client";

import { useState, use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EscrowInitiateButton from "@/components/escrow/EscrowInitiateButton";
import Modal from "@/components/ui/Modal";
import EnquiryForm from "@/components/listings/EnquiryForm";
import EnquirySuccess from "@/components/listings/EnquirySuccess";
import { getListingById } from "@/lib/listings";
import { useSavedListings } from "@/store/savedListings";
import { useHydrated } from "@/hooks/use-hydrated";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const property = getListingById(id);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const hydrated = useHydrated();
  const { saved, toggle } = useSavedListings();
  const isSaved = hydrated && saved.some((savedProperty) => savedProperty.id === id);

  if (!property) notFound();

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setSubmitted(false), 300);
  };

  const STATS = [
    {
      label: "Price",
      value: formatPrice(property.price, property.currency),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      label: "Type",
      value: property.type.charAt(0).toUpperCase() + property.type.slice(1),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Size",
      value: property.sizeSqm > 0 ? `${property.sizeSqm} m²` : "—",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      ),
    },
    {
      label: "Bedrooms",
      value: property.bedrooms > 0 ? String(property.bedrooms) : "—",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7v11m0-4h18M21 7v11M3 14h18V9a2 2 0 00-2-2H5a2 2 0 00-2 2v5z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="mx-auto max-w-5xl px-5 py-8">
        {/* Breadcrumb */}
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-kunda-muted transition-colors hover:text-kunda-forest"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div className="overflow-hidden rounded-3xl border border-kunda-border bg-white shadow-card">
          {/* Photo Section */}
          <div className="relative aspect-[16/7] w-full overflow-hidden bg-kunda-forest-soft">
            {property.imageUrl ? (
              <Image
                src={property.imageUrl}
                alt={property.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-8xl opacity-20">🏠</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Badges on photo */}
            <div className="absolute left-5 top-5 flex gap-2">
              {property.verified && (
                <span className="badge badge-green bg-white/90 backdrop-blur-sm shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-kunda-forest">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  Verified listing
                </span>
              )}
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={() => toggle(property)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110"
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "#0f6e56" : "none"}>
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  stroke={isSaved ? "#0f6e56" : "white"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-10">
            <div className="mb-6">
              <h1 className="mb-2 font-display text-3xl font-semibold text-kunda-ink">
                {property.title}
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-kunda-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {property.location}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-kunda-background p-4 transition-colors hover:bg-kunda-forest-soft"
                >
                  <div className="mb-2 text-kunda-muted">{stat.icon}</div>
                  <p className="text-xs font-medium uppercase tracking-wider text-kunda-muted">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-kunda-ink">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mb-10">
              <h2 className="mb-3 font-display text-xl font-semibold text-kunda-ink">
                About this property
              </h2>
              <p className="text-sm leading-7 text-kunda-muted">
                {property.description}
              </p>
            </div>

            {/* Agent Panel */}
            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-kunda-border bg-kunda-background p-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kunda-forest text-white font-semibold">
                    {property.agentName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-kunda-muted">
                      Listed by
                    </p>
                    <p className="font-semibold text-kunda-ink">
                      {property.agentName}
                    </p>
                    <p className="text-sm text-kunda-muted">{property.agentPhone}</p>
                  </div>
                </div>
                <div className="flex w-full gap-3 sm:w-auto">
                  <a
                    href={`https://wa.me/${property.agentPhone.replace(/\s/g, "").replace("+", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex-1 justify-center sm:flex-none"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                    WhatsApp
                  </a>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn-primary flex-1 justify-center sm:flex-none"
                  >
                    Enquire now
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6">
                <h2 className="mb-1 text-sm font-semibold text-gray-900">
                  Ready to purchase?
                </h2>
                <p className="mb-4 text-xs text-gray-500">
                  Secure this property through Kunda escrow. Your funds are
                  protected until completion.
                </p>
                <EscrowInitiateButton
                  listingId={property.id}
                  listingTitle={property.title}
                  price={property.price}
                  currency={property.currency}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={submitted ? "Enquiry sent" : "Contact the agent"}
      >
        {submitted ? (
          <EnquirySuccess onClose={closeModal} />
        ) : (
          <EnquiryForm
            property={property}
            onSuccess={() => setSubmitted(true)}
          />
        )}
      </Modal>
    </>
  );
}
