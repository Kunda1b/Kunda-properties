import { useMemo } from "react";
import { createSyncQueue } from "../offline/sync-queue";

export function useSyncQueue() {
  return useMemo(() => {
    const queue = createSyncQueue();

    queue.enqueue({
      id: "sync-1",
      kind: "CREATE_LISTING",
      payload: { listingId: "draft-kololi" },
      createdAt: Date.now() - 1000 * 60 * 12,
    });

    queue.enqueue({
      id: "sync-2",
      kind: "UPLOAD_PHOTO",
      payload: { photoCount: 6 },
      createdAt: Date.now() - 1000 * 60 * 4,
    });

    return {
      lastSyncLabel: "Auto-sync resumes when the connection is stable.",
      pending: queue.drain(),
    };
  }, []);
}
