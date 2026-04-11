"use client";

import Link from "next/link";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { formatDate, formatPrice } from "@/lib/utils";
import { useKundaStore } from "@/store/kunda-store";
import type { PropertyListing } from "@kunda/types";

type DashboardClientProps = {
  properties: PropertyListing[];
};

export function DashboardClient({ properties }: DashboardClientProps) {
  const { clearEnquiries, state } = useKundaStore();
  const { isHydrated, setValue: setSettings, value: settings } =
    useLocalStorageState("kunda.account-settings", {
      currency: "USD",
      emailAlerts: true,
      preferredRegion: "West Coast",
    });

  const savedListings = properties.filter((property) =>
    state.savedListingIds.includes(property.id),
  );

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-card rounded-[28px] p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-muted">
            Saved listings
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-kunda-ink">
            {state.savedListingIds.length}
          </p>
        </div>
        <div className="surface-card rounded-[28px] p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-muted">
            Enquiries sent
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-kunda-ink">
            {state.enquiries.length}
          </p>
        </div>
        <div className="surface-card rounded-[28px] p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-muted">
            Preferred region
          </p>
          <p className="mt-3 font-display text-4xl font-semibold text-kunda-ink">
            {settings.preferredRegion}
          </p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="surface-card rounded-[30px] p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-muted">
                Saved listings
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-kunda-ink">
                Revisit your shortlist
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {savedListings.length ? (
              savedListings.map((property) => (
                <div
                  key={property.id}
                  className="rounded-[24px] bg-white/80 p-4 shadow-soft"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-kunda-muted">{property.location}</p>
                      <h3 className="font-display text-2xl font-semibold text-kunda-ink">
                        {property.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-kunda-forest">
                        {formatPrice(property.price, property.currency)}
                      </p>
                      <p className="text-sm text-kunda-muted">{property.sizeLabel}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/listings/${property.slug}`}
                      className="rounded-full bg-kunda-forest px-4 py-2 text-sm font-semibold text-white"
                    >
                      View property
                    </Link>
                    <Link
                      href={`/listings?region=${encodeURIComponent(property.region)}`}
                      className="rounded-full border border-kunda-border px-4 py-2 text-sm font-semibold text-kunda-ink"
                    >
                      Similar in {property.region}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-white/80 p-6 text-sm leading-7 text-kunda-muted">
                No saved listings yet. Use the save button on any property card
                to build your shortlist.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section className="surface-card rounded-[30px] p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-muted">
                  Enquiry history
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-kunda-ink">
                  Buyer activity
                </h2>
              </div>
              {state.enquiries.length ? (
                <button
                  type="button"
                  onClick={clearEnquiries}
                  className="text-sm font-medium text-kunda-muted hover:text-kunda-ink"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {state.enquiries.length ? (
                state.enquiries.map((enquiry) => (
                  <div
                    key={`${enquiry.propertyId}-${enquiry.createdAt}`}
                    className="rounded-[24px] bg-white/80 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                      {formatDate(enquiry.createdAt)}
                    </p>
                    <p className="mt-2 font-semibold text-kunda-ink">
                      {enquiry.propertyTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-kunda-muted">
                      {enquiry.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] bg-white/80 p-6 text-sm leading-7 text-kunda-muted">
                  Your submitted enquiries will appear here after you use the
                  modal on a property detail page.
                </div>
              )}
            </div>
          </section>

          <section className="surface-card rounded-[30px] p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-muted">
              Account settings
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-kunda-ink">
              Preferences
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="rounded-[22px] bg-white px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                  Preferred currency
                </span>
                <select
                  value={settings.currency}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>

              <label className="rounded-[22px] bg-white px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                  Preferred region
                </span>
                <select
                  value={settings.preferredRegion}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      preferredRegion: event.target.value,
                    }))
                  }
                  className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
                >
                  <option value="West Coast">West Coast</option>
                  <option value="Kanifing">Kanifing</option>
                  <option value="Banjul">Banjul</option>
                </select>
              </label>

              <label className="flex items-center justify-between rounded-[22px] bg-white px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-kunda-ink">Email alerts</p>
                  <p className="text-sm text-kunda-muted">
                    Receive updates when saved listings change.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      emailAlerts: event.target.checked,
                    }))
                  }
                  disabled={!isHydrated}
                  className="h-5 w-5 accent-kunda-forest"
                />
              </label>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
