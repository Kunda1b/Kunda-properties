import { createActor } from "xstate";
import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import type { CreatePaymentRequest, EscrowStatus } from "@kunda/types";
import type {
  DisputeEscrowInput,
  InitiateEscrowInput,
} from "@kunda/validators";
import {
  createEscrowMachine,
  type EscrowContext,
  type EscrowEvent,
} from "../machine/escrow.machine";
import { logAuditEvent } from "../utils/audit";
import { calculateFees } from "../utils/fees";
import { createPaymentIntent, refundPayment } from "../utils/stripe";

const { logger, publishNotification } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

type EscrowRecord = {
  id: string;
  listingId: string;
  buyerId: string;
  amountGBP: unknown;
  platformFee: unknown;
  status: EscrowStatus;
  stripePaymentId: string | null;
  paymentProvider?: "STRIPE" | "WAVE" | "ORANGE_MONEY" | null;
  paymentMethod?: "CARD" | "MOBILE_MONEY" | null;
  fundingCurrency?: string;
};

export class EscrowService {
  async initiate(input: InitiateEscrowInput, buyerId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.status !== "PUBLISHED") {
      throw new Error("LISTING_NOT_AVAILABLE");
    }

    const existing = await prisma.escrowTransaction.findFirst({
      where: {
        listingId: input.listingId,
        buyerId,
        status: {
          notIn: ["COMPLETED", "REFUNDED"],
        },
      },
    });

    if (existing) {
      throw new Error("ESCROW_ALREADY_EXISTS");
    }

    const fees = calculateFees(Number(listing.price), listing.currency);

    const escrow = await prisma.$transaction(async (tx) => {
      const created = await tx.escrowTransaction.create({
        data: {
          listingId: input.listingId,
          buyerId,
          amountGBP: fees.subtotal,
          platformFee: fees.platformFee,
          status: "INITIATED",
        },
        include: {
          listing: true,
          buyer: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      });

      await logAuditEvent(
        {
          escrowId: created.id,
          event: "INITIATED",
          toStatus: "INITIATED",
          performedBy: buyerId,
          note: `Escrow initiated for listing: ${listing.title}`,
        },
        tx,
      );

      return created;
    });

    await publishNotification({
      event: "ESCROW_INITIATED",
      channel: "EMAIL",
      recipient: {
        email: escrow.buyer.email,
        name: escrow.buyer.fullName,
      },
      payload: {
        name: escrow.buyer.fullName,
        propertyTitle: listing.title,
        totalGBP: new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: listing.currency,
        }).format(fees.total),
        platformFee: new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: listing.currency,
        }).format(fees.platformFee),
      },
    });

    logger.info("Escrow initiated", {
      escrowId: escrow.id,
      listingId: input.listingId,
      buyerId,
      amount: fees.total,
    });

    return { escrow, fees };
  }

  async createPayment(
    escrowId: string,
    buyerId: string,
    buyerEmail: string,
    input: CreatePaymentRequest,
  ) {
    const escrow = await this.findAndValidate(escrowId, buyerId);

    if (escrow.status !== "INITIATED") {
      throw new Error("INVALID_STATE");
    }

    if (input.provider !== "STRIPE") {
      throw new Error("PAYMENT_METHOD_NOT_SUPPORTED");
    }

    const fees = calculateFees(Number(escrow.amountGBP), input.currency);
    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      fees.total,
      input.currency,
      escrowId,
      buyerEmail,
    );

    await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        paymentProvider: "STRIPE",
        paymentMethod: "CARD",
        paymentStatus: "PENDING",
        providerPaymentId: paymentIntentId,
        stripePaymentId: paymentIntentId,
        fundingCurrency: input.currency,
      },
    });

    return {
      provider: "STRIPE",
      paymentMethod: "CARD",
      currency: input.currency,
      paymentStatus: "PENDING",
      providerPaymentId: paymentIntentId,
      clientSecret,
      fees,
    };
  }

  async fund(escrowId: string, stripePaymentId: string, currency = "GBP") {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
        buyer: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    if (escrow.status === "FUNDED" && escrow.stripePaymentId === stripePaymentId) {
      return escrow;
    }

    const newState = this.getNextState(escrow, {
      type: "FUND",
      stripePaymentId,
    });

    if (newState !== "FUNDED") {
      throw new Error("INVALID_TRANSITION");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: "FUNDED",
          stripePaymentId,
          providerPaymentId: stripePaymentId,
          paymentProvider: "STRIPE",
          paymentMethod: "CARD",
          paymentStatus: "SUCCEEDED",
          fundingCurrency: currency,
          fundedAt: new Date(),
        },
      });

      await logAuditEvent(
        {
          escrowId,
          event: "FUND",
          fromStatus: escrow.status,
          toStatus: "FUNDED",
          note: `Stripe payment: ${stripePaymentId}`,
        },
        tx,
      );

      return updated;
    });

    await publishNotification({
      event: "ESCROW_FUNDED",
      channel: "EMAIL",
      recipient: {
        email: escrow.buyer.email,
        name: escrow.buyer.fullName,
      },
      payload: {
        name: escrow.buyer.fullName,
        propertyTitle: escrow.listing.title,
        totalGBP: new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency,
        }).format(Number(escrow.amountGBP) + Number(escrow.platformFee)),
      },
    });

    await publishNotification({
      event: "ESCROW_FUNDED",
      channel: "WHATSAPP",
      recipient: {
        name: escrow.buyer.fullName,
      },
      payload: {
        name: escrow.buyer.fullName,
        propertyTitle: escrow.listing.title,
        totalGBP: new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency,
        }).format(Number(escrow.amountGBP) + Number(escrow.platformFee)),
      },
    });

    return updated;
  }

  async markPaymentFailed(
    escrowId: string,
    providerPaymentId: string,
    reason?: string,
  ) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          paymentStatus: "FAILED",
          providerPaymentId,
          stripePaymentId: providerPaymentId,
        },
      });

      await logAuditEvent(
        {
          escrowId,
          event: "PAYMENT_FAILED",
          fromStatus: escrow.status,
          toStatus: escrow.status,
          note: reason ?? "Stripe payment failed",
        },
        tx,
      );

      return updated;
    });
  }

  async verifyTitle(escrowId: string, adminId: string, note?: string) {
    return this.transition(escrowId, { type: "VERIFY_TITLE", note }, {
      toStatus: "TITLE_VERIFIED",
      performedBy: adminId,
      note,
    });
  }

  async signDocs(escrowId: string, adminId: string, note?: string) {
    return this.transition(escrowId, { type: "SIGN_DOCS", note }, {
      toStatus: "DOCS_SIGNED",
      performedBy: adminId,
      note,
    });
  }

  async complete(escrowId: string, adminId: string, note?: string) {
    return this.transition(escrowId, { type: "COMPLETE", note }, {
      toStatus: "COMPLETED",
      performedBy: adminId,
      note,
    });
  }

  async dispute(
    escrowId: string,
    userId: string,
    input: DisputeEscrowInput,
  ) {
    const escrow = await this.findAndValidate(escrowId, userId);
    const newState = this.getNextState(escrow, {
      type: "DISPUTE",
      reason: input.reason,
    });

    if (newState !== "DISPUTED") {
      throw new Error("INVALID_TRANSITION");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: "DISPUTED",
        },
      });

      await logAuditEvent(
        {
          escrowId,
          event: "DISPUTE",
          fromStatus: escrow.status,
          toStatus: "DISPUTED",
          performedBy: userId,
          note: input.reason,
        },
        tx,
      );

      return updated;
    });
  }

  async refund(escrowId: string, adminId: string, note?: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    const event: EscrowEvent =
      escrow.status === "DISPUTED"
        ? { type: "RESOLVE_DISPUTE", note }
        : { type: "REFUND", note };

    const newState = this.getNextState(escrow, event);

    if (newState !== "REFUNDED") {
      throw new Error("INVALID_TRANSITION");
    }

    if (escrow.stripePaymentId) {
      await refundPayment(escrow.stripePaymentId, note ?? "Admin initiated refund");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
          refundedAt: new Date(),
        },
      });

      await logAuditEvent(
        {
          escrowId,
          event: event.type,
          fromStatus: escrow.status,
          toStatus: "REFUNDED",
          performedBy: adminId,
          note,
        },
        tx,
      );

      return updated;
    });
  }

  async findById(escrowId: string) {
    return prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            currency: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        auditEvents: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  async findByBuyer(buyerId: string) {
    return prisma.escrowTransaction.findMany({
      where: { buyerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            currency: true,
          },
        },
        auditEvents: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAll(filters?: { status?: EscrowStatus }) {
    return prisma.escrowTransaction.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            currency: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  private async transition(
    escrowId: string,
    event: EscrowEvent,
    audit: {
      toStatus: EscrowStatus;
      performedBy?: string;
      note?: string;
    },
  ) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    const newState = this.getNextState(escrow, event);

    if (newState !== audit.toStatus) {
      throw new Error("INVALID_TRANSITION");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: audit.toStatus,
        },
      });

      await logAuditEvent(
        {
          escrowId,
          event: event.type,
          fromStatus: escrow.status,
          toStatus: audit.toStatus,
          performedBy: audit.performedBy,
          note: audit.note,
        },
        tx,
      );

      return updated;
    });
  }

  private getNextState(escrow: EscrowRecord, event: EscrowEvent): EscrowStatus {
    const actor = createActor(createEscrowMachine(escrow.status), {
      input: this.toMachineContext(escrow),
    });

    actor.start();
    actor.send(event);

    return actor.getSnapshot().value as EscrowStatus;
  }

  private toMachineContext(escrow: EscrowRecord): EscrowContext {
    return {
      escrowId: escrow.id,
      listingId: escrow.listingId,
      buyerId: escrow.buyerId,
      amountGBP: Number(escrow.amountGBP),
      platformFee: Number(escrow.platformFee),
      stripePaymentId: escrow.stripePaymentId ?? undefined,
    };
  }

  private async findAndValidate(escrowId: string, userId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        listing: {
          select: {
            currency: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    if (escrow.buyerId !== userId) {
      throw new Error("FORBIDDEN");
    }

    return escrow;
  }
}

export const escrowService = new EscrowService();
