"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { listingRegions } from "@/lib/properties";

export function HeroSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");

  const handleSubmit = (formData: FormData) => {
    const nextQuery = String(formData.get("query") ?? "").trim();
    const nextRegion = String(formData.get("region") ?? "").trim();
    const params = new URLSearchParams();

    if (nextQuery) {
      params.set("query", nextQuery);
    }

    if (nextRegion) {
      params.set("region", nextRegion);
    }

    startTransition(() => {
      router.push(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  return (
    <form action={handleSubmit} className="surface-card rounded-[30px] p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr_auto]">
        <div className="rounded-[22px] bg-white px-4 py-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
            Search
          </label>
          <input
            name="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Beach villa, titled land, rental apartment..."
            className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
          />
        </div>

        <div className="rounded-[22px] bg-white px-4 py-3">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
            Region
          </label>
          <select
            name="region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
          >
            <option value="">Any region</option>
            {listingRegions.map((regionOption) => (
              <option key={regionOption} value={regionOption}>
                {regionOption}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-[22px] bg-kunda-forest px-6 py-4 text-sm font-semibold text-white shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
        >
          Search listings
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Verified title", "Escrow ready", "Diaspora support"].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-kunda-muted"
          >
            {chip}
          </span>
        ))}
      </div>
    </form>
  );
}
