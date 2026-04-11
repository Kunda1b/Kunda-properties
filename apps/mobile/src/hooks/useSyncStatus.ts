import { useMemo } from "react";
import { useOfflineListings } from "./useOfflineListings";
import { useSyncQueue } from "./useSyncQueue";

export function useSyncStatus() {
  const { drafts } = useOfflineListings();
  const { pending } = useSyncQueue();

  return useMemo(
    () => ({
      detail: `${drafts.length} drafts available offline`,
      label: `${pending.length} queued actions waiting for sync`,
    }),
    [drafts.length, pending.length],
  );
}
