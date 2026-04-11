import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import { logAuditEvent } from "../utils/audit";
import { convertGBPtoGMD, getGBPtoGMDRate } from "../utils/fx";
import {
  getPendingOrangeMoneyPayouts,
  markOrangeMoneyComplete,
  queueOrangeMoneyPayout,
} from "../utils/orange-money";
import { getWaveBalance, getWavePayoutStatus, sendWavePayout } from "../utils/wave";

const { logger } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } =
  ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

export type PayoutProvider = "WAVE" | "ORANGE_MONEY";

export type InitiatePayoutInput = {
  escrowId: string;
  adminId: string;
  provider: PayoutProvider;
  recipientPhone: string;
  recipientName: string;
};

export class PayoutService {
  async initiatePayout(input: InitiatePayoutInput) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: input.escrowId },
      include: {
        listing: {
          select: { title: true, price: true },
        },
      },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    if (escrow.status !== "COMPLETED") {
      throw new Error("ESCROW_NOT_COMPLETED");
    }

    const fx = await getGBPtoGMDRate();
    const sellerAmountGBP = Number(escrow.amountGBP);
    const sellerAmountGMD = convertGBPtoGMD(sellerAmountGBP, fx.rate);
    const reference = `KUNDA-PAYOUT-${escrow.id.slice(0, 8).toUpperCase()}`;

    await prisma.escrowTransaction.update({
      where: { id: input.escrowId },
      data: { amountGMD: sellerAmountGMD },
    });

    let result: unknown;

    if (input.provider === "WAVE") {
      result = await sendWavePayout({
        recipientPhone: input.recipientPhone,
        amountGMD: sellerAmountGMD,
        reference,
        description: `Kunda property sale: ${escrow.listing.title}`,
      });

      await logAuditEvent({
        escrowId: input.escrowId,
        event: "WAVE_PAYOUT_SENT",
        fromStatus: "COMPLETED",
        toStatus: "COMPLETED",
        performedBy: input.adminId,
        note: JSON.stringify({
          provider: "WAVE",
          payoutId: (result as { id: string }).id,
          status: (result as { status: string }).status,
          amountGMD: sellerAmountGMD,
          fxRate: fx.rate,
          recipientPhone: input.recipientPhone,
        }),
      });

      logger.info("Wave payout initiated", {
        escrowId: input.escrowId,
        payoutId: (result as { id: string }).id,
        amountGMD: sellerAmountGMD,
      });
    } else {
      result = await queueOrangeMoneyPayout({
        escrowId: input.escrowId,
        recipientPhone: input.recipientPhone,
        recipientName: input.recipientName,
        amountGMD: sellerAmountGMD,
        reference,
      });

      logger.info("Orange Money payout queued", {
        escrowId: input.escrowId,
        amountGMD: sellerAmountGMD,
      });
    }

    return {
      provider: input.provider,
      amountGBP: sellerAmountGBP,
      amountGMD: sellerAmountGMD,
      fxRate: fx.rate,
      fxSource: fx.source,
      reference,
      result,
    };
  }

  async getWavePayoutStatus(payoutId: string) {
    return getWavePayoutStatus(payoutId);
  }

  async getPendingOrangeMoneyPayouts() {
    return getPendingOrangeMoneyPayouts();
  }

  async markOrangeMoneyComplete(
    payoutId: string,
    adminId: string,
    note?: string,
  ) {
    return markOrangeMoneyComplete(payoutId, adminId, note);
  }

  async getWalletBalance() {
    const balance = await getWaveBalance();
    const fx = await getGBPtoGMDRate();

    return {
      wave: balance,
      fxRate: fx.rate,
      equivalentGBP: parseFloat((balance.amount / fx.rate).toFixed(2)),
    };
  }

  async getPayoutHistory(escrowId: string) {
    const events = await prisma.escrowAuditEvent.findMany({
      where: {
        escrowId,
        event: {
          in: ["WAVE_PAYOUT_SENT", "ORANGE_MONEY_PAYOUT_QUEUED"],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return events.map((event) => ({
      id: event.id,
      event: event.event,
      performedBy: event.performedBy,
      data: event.note ? JSON.parse(event.note) : {},
      createdAt: event.createdAt.toISOString(),
    }));
  }
}

export const payoutService = new PayoutService();
