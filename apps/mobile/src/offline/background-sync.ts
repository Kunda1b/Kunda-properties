export function getBackgroundSyncPlan() {
  return {
    cadence: "Resume queue drain when the device reconnects or wakes.",
    target: "Push queued listing drafts and media uploads to the gateway.",
  };
}
