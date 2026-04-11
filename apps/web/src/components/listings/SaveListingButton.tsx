"use client";

import { useKundaStore } from "@/store/kunda-store";

type SaveListingButtonProps = {
  propertyId: string;
};

export function SaveListingButton({ propertyId }: SaveListingButtonProps) {
  const { isSaved, toggleSavedListing } = useKundaStore();
  const saved = isSaved(propertyId);

  return (
    <button
      type="button"
      onClick={() => toggleSavedListing(propertyId)}
      className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-kunda-ink shadow-soft backdrop-blur transition-colors hover:bg-white"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
