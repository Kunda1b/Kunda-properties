"use client";

import { useKundaStore } from "@/store/kunda-store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function EnquiriesPage() {
  const hydrated = useHydrated();
  const { state, clearEnquiries } = useKundaStore();

  if (!hydrated) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-kunda-forest-soft/30" />
        ))}
      </div>
    );
  }

  if (state.enquiries.length === 0) {
    return (
      <div className="surface-card rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kunda-gold-soft">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-kunda-gold">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" />
            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
        <h3 className="mb-2 font-display text-xl font-semibold text-kunda-ink">
          No enquiries yet
        </h3>
        <p className="text-sm text-kunda-muted">
          Your submitted enquiries will appear here after you contact an agent.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-kunda-muted">
          {state.enquiries.length} enquir{state.enquiries.length !== 1 ? "ies" : "y"}
        </p>
        <button
          type="button"
          onClick={clearEnquiries}
          className="btn-ghost text-xs text-red-400 hover:!text-red-600"
        >
          Clear all
        </button>
      </div>

      {state.enquiries.map((enquiry) => (
        <div
          key={`${enquiry.propertyId}-${enquiry.createdAt}`}
          className="surface-card rounded-2xl p-5"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="badge badge-green">Sent</span>
            <span className="text-xs text-kunda-muted">
              {new Date(enquiry.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <h3 className="font-semibold text-kunda-ink">{enquiry.propertyTitle}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-kunda-muted">
            {enquiry.message}
          </p>
        </div>
      ))}
    </div>
  );
}
