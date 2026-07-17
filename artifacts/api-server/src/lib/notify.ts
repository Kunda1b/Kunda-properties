import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";

/**
 * Creates an in-app notification for a user.
 * Failures are silent — they never block the calling route.
 */
export async function notify(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  try {
    await db.insert(notifications).values({
      userId, title, body, type: "IN_APP", status: "SENT",
      sentAt: new Date(), data: data ?? null,
    });
  } catch {
    /* intentional no-op */
  }
}
