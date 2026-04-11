import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Property } from "@/types/property";

type SavedListingsStore = {
  saved: Property[];
  toggle: (property: Property) => void;
  isSaved: (id: string) => boolean;
  clear: () => void;
};

export const useSavedListings = create<SavedListingsStore>()(
  persist(
    (set, get) => ({
      saved: [],

      toggle: (property) => {
        const already = get().isSaved(property.id);
        set((state) => ({
          saved: already
            ? state.saved.filter((p) => p.id !== property.id)
            : [property, ...state.saved],
        }));
      },

      isSaved: (id) => get().saved.some((p) => p.id === id),

      clear: () => set({ saved: [] }),
    }),
    { name: "kunda-saved-listings" },
  ),
);
