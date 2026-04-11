"use client";

import { useHydrated } from "@/hooks/use-hydrated";
import { useSavedListings } from "@/store/savedListings";
import { Property } from "@/types/property";

export default function SaveButton({ property }: { property: Property }) {
  const hydrated = useHydrated();
  const { toggle, isSaved } = useSavedListings();
  const saved = hydrated ? isSaved(property.id) : false;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(property);
      }}
      aria-label={saved ? "Remove from saved" : "Save property"}
      className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
      style={{
        backgroundColor: saved ? "var(--kunda-green)" : "white",
        borderColor: saved ? "var(--kunda-green)" : "#e5e7eb",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          stroke={saved ? "white" : "#9ca3af"}
          strokeWidth="1.8"
          fill={saved ? "white" : "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
