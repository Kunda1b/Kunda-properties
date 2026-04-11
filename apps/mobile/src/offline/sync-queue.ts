export type SyncOperation = {
  id: string;
  kind: "CREATE_LISTING" | "UPDATE_LISTING" | "UPLOAD_PHOTO";
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
};

/** In-memory stub; swap for SQLite-backed queue + processor. */
export function createSyncQueue() {
  const pending: SyncOperation[] = [];
  return {
    enqueue(op: Omit<SyncOperation, "attempts">) {
      pending.push({ ...op, attempts: 0 });
    },
    drain(): SyncOperation[] {
      return pending.splice(0, pending.length);
    },
  };
}
