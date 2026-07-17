import type { Request } from "express";
import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { logger } from "./logger.js";

export interface AuditInput {
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  userId?: string | null;
}

/** Persist a sensitive-action audit row. Never throws to the request path. */
export async function writeAudit(req: Request | null, input: AuditInput): Promise<void> {
  try {
    const userId =
      input.userId ??
      (req ? ((req as any).user?.id as string | undefined) : undefined) ??
      null;

    await db.insert(auditLogs).values({
      userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      oldValues: (input.oldValues as any) ?? null,
      newValues: (input.newValues as any) ?? null,
      ipAddress: req?.ip ?? null,
      userAgent: req?.headers?.["user-agent"]?.toString().slice(0, 500) ?? null,
    });
  } catch (err) {
    logger.error({ err, audit: input }, "Failed to write audit log");
  }
}
