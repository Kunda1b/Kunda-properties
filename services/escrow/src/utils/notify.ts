import { logger } from "./logger";
export async function notifyEscrowEvent(event: string, escrowId: string, userIds: string[]) {
  try {
    const url = process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4005";
    await fetch(`${url}/notify/escrow`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, escrowId, userIds }),
    });
  } catch (err) { logger.warn({ err, event, escrowId }, "Failed to send escrow notification"); }
}
