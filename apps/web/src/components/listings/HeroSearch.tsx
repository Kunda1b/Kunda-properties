"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PropertyType } from "@/types/property";

const TYPES: { label: string; value: PropertyType | "" }[] = [
  { label: "All types", value: "" },
  { label: "Houses", value: "house" },
  { label: "Land", value: "land" },
  { label: "Apartments", value: "apartment" },
  { label: "Commercial", value: "commercial" },
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", type);
    const qs = params.toString();
    router.push(`/listings${qs ? `?${qs}` : ""}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kunda-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M21 21l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by location, e.g. Kololi, Brufut..."
          className="input-field pl-10 !rounded-xl shadow-card"
        />
      </div>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="input-field !w-auto !rounded-xl shadow-card sm:max-w-[160px] appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%23627067%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat"
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <button type="submit" className="btn-primary !rounded-xl shadow-glow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        Search
      </button>
    </form>
  );
}
