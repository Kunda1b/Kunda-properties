import { useMemo } from "react";

export type OfflineListingDraft = {
  id: string;
  title: string;
  locality: string;
  updatedAt: string;
  status: "Draft" | "Ready to sync";
};

export function useOfflineListings() {
  return useMemo(
    () => ({
      drafts: [
        {
          id: "draft-kololi",
          title: "Kololi villa intake",
          locality: "Kololi",
          updatedAt: "Updated 10 minutes ago",
          status: "Ready to sync" as const,
        },
        {
          id: "draft-brufut",
          title: "Brufut serviced plots",
          locality: "Brufut",
          updatedAt: "Updated 42 minutes ago",
          status: "Draft" as const,
        },
      ],
    }),
    [],
  );
}
