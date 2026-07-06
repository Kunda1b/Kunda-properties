import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { apiVersion: "2024-04-10" });
const PLATFORM_FEE_PERCENT = 2.5;

export async function initiateEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const buyerId = (req as any).user.id;
    const { listingId, offerId } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") throw new AppError("Listing not available", 400, "LISTING_UNAVAILABLE");

    let finalAmount = Number(listing.price);
    let finalCurrency = listing.currency;

    if (offerId) {
      const offer = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!offer || offer.status !== "ACCEPTED" || offer.buyerId !== buyerId) throw new AppError("Invalid or unaccepted offer", 400, "OFFER_INVALID");
      finalAmount = Number(offer.amount);
      finalCurrency = offer.currency;
    }

    const existing = await prisma.escrowAccount.findFirst({
      where: { listingId, buyerId, status: { in: ["INITIATED", "FUNDED", "INSPECTING"] } },
    });
    if (existing) throw new AppError("Active escrow already exists for this listing", 409, "ESCROW_EXISTS");

    const platformFeeAmount = (finalAmount * PLATFORM_FEE_PERCENT) / 100;
    const sellerPayoutAmount = finalAmount - platformFeeAmount;
    const inspectionDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const escrow = await prisma.escrowAccount.create({
      data: {
        listingId, offerId, buyerId, sellerId: listing.sellerId,
        totalAmount: finalAmount, currency: finalCurrency as any,
        platformFeePercent: PLATFORM_FEE_PERCENT, platformFeeAmount, sellerPayoutAmount,
        inspectionDeadline, status: "INITIATED",
        milestones: {
          create: [
            { title: "Initial Deposit", description: "Buyer funds escrow", amount: finalAmount, order: 1 },
            { title: "Inspection Period", description: "14-day inspection window", amount: 0, order: 2 },
            { title: "Final Release", description: "Funds released to seller", amount: sellerPayoutAmount, order: 3 },
          ],
        },
      },
      include: { milestones: { orderBy: { order: "asc" } }, listing: true },
    });

    logger.info({ escrowId: escrow.id, buyerId, listingId }, "Escrow initiated");
    res.status(201).json({ success: true, data: escrow });
  } catch (error) { next(error); }
}

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { escrowId } = req.params;
    const buyerId = (req as any).user.id;

    const escrow = await prisma.escrowAccount.findUnique({ where: { id: escrowId }, include: { buyer: true, listing: true } });
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== buyerId) throw new AppError("Access denied", 403, "FORBIDDEN");
    if (escrow.status !== "INITIATED") throw new AppError("Escrow is not in INITIATED state", 400, "INVALID_STATE");

    const stripeCurrency = escrow.currency === "GMD" ? "usd" : escrow.currency.toLowerCase();
    const amountInCents = Math.round(Number(escrow.totalAmount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents, currency: stripeCurrency,
      metadata: { escrowId: escrow.id, listingId: escrow.listingId, buyerId, sellerId: escrow.sellerId },
      description: `Kunda Properties Escrow — ${escrow.listing.title}`,
      receipt_email: escrow.buyer.email,
    });

    await prisma.escrowAccount.update({ where: { id: escrowId }, data: { stripePaymentIntentId: paymentIntent.id } });
    await prisma.transaction.create({
      data: { escrowId, type: "DEPOSIT", status: "PENDING", amount: escrow.totalAmount, currency: escrow.currency, stripePaymentIntentId: paymentIntent.id },
    });

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: amountInCents, currency: stripeCurrency } });
  } catch (error) { next(error); }
}

export async function approveRelease(req: Request, res: Response, next: NextFunction) {
  try {
    const { escrowId } = req.params;
    const buyerId = (req as any).user.id;
    const { notes } = req.body;

    const escrow = await prisma.escrowAccount.findUnique({ where: { id: escrowId }, include: { seller: true } });
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== buyerId) throw new AppError("Only the buyer can approve release", 403, "FORBIDDEN");
    if (!["FUNDED", "INSPECTING"].includes(escrow.status)) throw new AppError("Escrow cannot be released in current state", 400, "INVALID_STATE");
    if (!escrow.stripePaymentIntentId) throw new AppError("No payment found", 400, "NO_PAYMENT");

    let transferId: string | undefined;
    if (escrow.seller.stripeAccountId) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(escrow.sellerPayoutAmount) * 100),
        currency: escrow.currency === "GMD" ? "usd" : escrow.currency.toLowerCase(),
        destination: escrow.seller.stripeAccountId,
        metadata: { escrowId, listingId: escrow.listingId },
      });
      transferId = transfer.id;
    }

    await prisma.$transaction([
      prisma.escrowAccount.update({ where: { id: escrowId }, data: { status: "RELEASED", releasedAt: new Date(), stripeTransferId: transferId, releaseNotes: notes } }),
      prisma.transaction.create({ data: { escrowId, type: "RELEASE", status: "COMPLETED", amount: escrow.sellerPayoutAmount!, currency: escrow.currency, stripeChargeId: transferId, processedAt: new Date() } }),
      prisma.listing.update({ where: { id: escrow.listingId }, data: { status: "SOLD" } }),
    ]);

    logger.info({ escrowId, transferId }, "Escrow funds released");
    res.json({ success: true, message: "Funds released to seller. Congratulations on your purchase!" });
  } catch (error) { next(error); }
}

export async function raiseDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const { escrowId } = req.params;
    const userId = (req as any).user.id;
    const { reason } = req.body;

    const escrow = await prisma.escrowAccount.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== userId && escrow.sellerId !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");
    if (!["FUNDED", "INSPECTING"].includes(escrow.status)) throw new AppError("Cannot dispute in current state", 400, "INVALID_STATE");

    await prisma.escrowAccount.update({ where: { id: escrowId }, data: { status: "DISPUTED", disputeReason: reason } });
    logger.info({ escrowId, userId }, "Dispute raised");
    res.json({ success: true, message: "Dispute raised. Our team will review within 48 hours." });
  } catch (error) { next(error); }
}

export async function getEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { escrowId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const escrow = await prisma.escrowAccount.findUnique({
      where: { id: escrowId },
      include: {
        listing: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        milestones: { orderBy: { order: "asc" } },
        transactions: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== userId && escrow.sellerId !== userId && userRole !== "ADMIN") throw new AppError("Access denied", 403, "FORBIDDEN");

    res.json({ success: true, data: escrow });
  } catch (error) { next(error); }
}

export async function getMyEscrows(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { role = "buyer", status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = role === "buyer" ? { buyerId: userId } : { sellerId: userId };
    if (status) where.status = status;

    const [escrows, total] = await Promise.all([
      prisma.escrowAccount.findMany({
        where, skip, take: Number(limit),
        include: {
          listing: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          buyer: { include: { profile: { select: { firstName: true, lastName: true } } } },
          seller: { include: { profile: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.escrowAccount.count({ where }),
    ]);
    res.json({ success: true, data: { escrows, total, page: Number(page), limit: Number(limit) } });
  } catch (error) { next(error); }
}
