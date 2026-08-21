import { createHash } from "node:crypto";

/** Refresh tokens are bearer credentials; only their digest belongs in Postgres. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
