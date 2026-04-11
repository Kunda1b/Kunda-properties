import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";

const { logger } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } =
  ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

export type OrangeMoneyPayoutStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type OrangeMoneyPayout = {
  id: string;
  escrowId: string;
  recipientPhone: string;
  recipientName: string;
  amountGMD: number;
  reference: string;
  status: OrangeMoneyPayoutStatus;
  processedAt?: string;
  processedBy?: string;
  note?: string;
  createdAt: string;
};

export async function queueOrangeMoneyPayout(input: {
  escrowId: string;
  recipientPhone: string;
  recipientName: string;
  amountGMD: number;
  reference: string;
}): Promise<OrangeMoneyPayout> {
  const payout = await prisma.escrowAuditEvent.create({
    data: {
      escrowId: input.escrowId,
      event: "ORANGE_MONEY_PAYOUT_QUEUED",
      toStatus: "COMPLETED",
      note: JSON.stringify({
        provider: "ORANGE_MONEY",
        recipientPhone: input.recipientPhone,
        recipientName: input.recipientName,
        amountGMD: input.amountGMD,
        reference: input.reference,
        status: "QUEUED",
      }),
    },
  });

  logger.info("Orange Money payout queued", {
    escrowId: input.escrowId,
    recipientPhone: input.recipientPhone,
    amountGMD: input.amountGMD,
  });

  return {
    id: payout.id,
    escrowId: input.escrowId,
    recipientPhone: input.recipientPhone,
    recipientName: input.recipientName,
    amountGMD: input.amountGMD,
    reference: input.reference,
    status: "QUEUED",
    createdAt: payout.createdAt.toISOString(),
  };
}

export async function markOrangeMoneyComplete(
  payoutId: string,
  adminId: string,
  note?: string,
): Promise<void> {
  const existing = await prisma.escrowAuditEvent.findUnique({
    where: { id: payoutId },
  });

  if (!existing) {
    throw new Error("PAYOUT_NOT_FOUND");
  }

  const current = existing.note ? JSON.parse(existing.note) : {};

  await prisma.escrowAuditEvent.update({
    where: { id: payoutId },
    data: {
      performedBy: adminId,
      note: JSON.stringify({
        ...current,
        status: "COMPLETED",
        processedAt: new Date().toISOString(),
        processedBy: adminId,
        note,
      }),
    },
  });

  logger.info("Orange Money payout marked complete", {
    payoutId,
    adminId,
  });
}

export async function getPendingOrangeMoneyPayouts() {
  const events = await prisma.escrowAuditEvent.findMany({
    where: {
      event: "ORANGE_MONEY_PAYOUT_QUEUED",
      performedBy: null,
    },
    include: {
      escrow: {
        include: {
          listing: { select: { title: true, location: true } },
          buyer: { select: { fullName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return events.map((event) => {
    const data = JSON.parse(event.note || "{}");
    return {
      id: event.id,
      escrowId: event.escrowId,
      ...data,
      listing: event.escrow.listing,
      buyer: event.escrow.buyer,
      createdAt: event.createdAt.toISOString(),
    };
  });
}
