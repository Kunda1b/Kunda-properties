import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

type AuditClient = Pick<typeof prisma, "escrowAuditEvent">;

export async function logAuditEvent(
  {
    escrowId,
    event,
    fromStatus,
    toStatus,
    performedBy,
    note,
  }: {
    escrowId: string;
    event: string;
    fromStatus?: string;
    toStatus: string;
    performedBy?: string;
    note?: string;
  },
  client: AuditClient = prisma,
): Promise<void> {
  try {
    await client.escrowAuditEvent.create({
      data: {
        escrowId,
        event,
        fromStatus,
        toStatus,
        performedBy,
        note,
      },
    });

    logger.info("Escrow audit event logged", {
      escrowId,
      event,
      fromStatus,
      toStatus,
    });
  } catch (error) {
    logger.error("Failed to log audit event", {
      escrowId,
      event,
      error: error instanceof Error ? error.message : "Unknown audit error",
    });
    throw error;
  }
}
