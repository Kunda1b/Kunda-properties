import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { escrowAccounts, escrowMilestones, transactions, listings, offers, kycRecords } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { notify } from "../lib/notify.js";

const router = Router();
router.use(authenticate);

const PLATFORM_FEE_PERCENT = 2.5;

// ── GET /escrow/my ────────────────────────────────────────────────────────────
router.get("/my", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const myEscrows = await db.query.escrowAccounts.findMany({
      where: (e, { or: orFn, eq: eqFn }) => orFn(eqFn(e.buyerId, userId), eqFn(e.sellerId, userId)),
      with: {
        listing: { columns: { title: true, region: true, price: true, currency: true } },
        buyer: { with: { profile: { columns: { firstName: true, lastName: true } } } },
        seller: { with: { profile: { columns: { firstName: true, lastName: true } } } },
        milestones: { orderBy: (m: any, { asc }: any) => [asc(m.order)] },
      },
      orderBy: (e, { desc }) => [desc(e.createdAt)],
    });
    res.json({ success: true, data: { escrows: myEscrows } });
  } catch (err) { next(err); }
});

// ── GET /escrow/:escrowId ─────────────────────────────────────────────────────
router.get("/:escrowId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const [escrow] = await db.query.escrowAccounts.findMany({
      where: (e, { eq: eqFn }) => eqFn(e.id, req.params.escrowId),
      with: {
        listing: { with: { images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 } } },
        buyer: { with: { profile: true } },
        seller: { with: { profile: true } },
        milestones: { orderBy: (m: any, { asc }: any) => [asc(m.order)] },
        transactions: { orderBy: (t: any, { desc }: any) => [desc(t.createdAt)] },
      },
      limit: 1,
    }) as any[];

    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== userId && escrow.sellerId !== userId)
      throw new AppError("Access denied", 403, "FORBIDDEN");

    res.json({ success: true, data: escrow });
  } catch (err) { next(err); }
});

// ── POST /escrow ──────────────────────────────────────────────────────────────
router.post(
  "/",
  validate([body("listingId").notEmpty()]),
  async (req, res, next) => {
    try {
      const buyerId = (req as any).user.id;
      const { listingId, offerId } = req.body;

      // KYC gate: buyer must be verified
      const [kyc] = await db.select({ status: kycRecords.status })
        .from(kycRecords).where(eq(kycRecords.userId, buyerId)).limit(1);
      if (!kyc || kyc.status !== "VERIFIED") {
        throw new AppError(
          "Identity verification required before initiating escrow. Please complete KYC.",
          403,
          "KYC_REQUIRED",
        );
      }

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing || listing.status !== "ACTIVE")
        throw new AppError("Listing not available", 400, "LISTING_UNAVAILABLE");
      if (listing.sellerId === buyerId)
        throw new AppError("Cannot initiate escrow on your own listing", 400, "OWN_LISTING");

      // Check for existing active escrow
      const [existingEscrow] = await db.select({ id: escrowAccounts.id }).from(escrowAccounts)
        .where(and(
          eq(escrowAccounts.listingId, listingId),
          eq(escrowAccounts.buyerId, buyerId),
          inArray(escrowAccounts.status, ["INITIATED", "FUNDED", "INSPECTING"]),
        )).limit(1);
      if (existingEscrow) throw new AppError("Active escrow already exists for this listing", 409, "ESCROW_EXISTS");

      let finalAmount = Number(listing.price);
      let finalCurrency = listing.currency;

      if (offerId) {
        const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);
        if (!offer || offer.status !== "ACCEPTED" || offer.buyerId !== buyerId)
          throw new AppError("Invalid or unaccepted offer", 400, "OFFER_INVALID");
        finalAmount = Number(offer.amount);
        finalCurrency = offer.currency;
      }

      const platformFeeAmount = (finalAmount * PLATFORM_FEE_PERCENT) / 100;
      const sellerPayoutAmount = finalAmount - platformFeeAmount;
      const inspectionDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const referenceNumber = `KND-${Date.now().toString(36).toUpperCase()}`;

      const [escrow] = await db.insert(escrowAccounts).values({
        listingId, offerId: offerId || null, buyerId, sellerId: listing.sellerId,
        totalAmount: String(finalAmount), currency: finalCurrency,
        platformFeePercent: String(PLATFORM_FEE_PERCENT),
        platformFeeAmount: String(platformFeeAmount),
        sellerPayoutAmount: String(sellerPayoutAmount),
        inspectionDeadline, referenceNumber, status: "INITIATED",
      }).returning();

      await db.insert(escrowMilestones).values([
        { escrowId: escrow.id, title: "Initial Deposit", description: "Buyer funds escrow", amount: String(finalAmount), order: 1 },
        { escrowId: escrow.id, title: "Inspection Period", description: "14-day inspection window", amount: "0", order: 2 },
        { escrowId: escrow.id, title: "Final Release", description: "Funds released to seller", amount: String(sellerPayoutAmount), order: 3 },
      ]);

      const result = await db.query.escrowAccounts.findMany({
        where: (e, { eq: eqFn }) => eqFn(e.id, escrow.id),
        with: { milestones: { orderBy: (m: any, { asc }: any) => [asc(m.order)] }, listing: true },
        limit: 1,
      });

      // Notify seller
      await notify(
        listing.sellerId,
        "Escrow Initiated",
        `A buyer has initiated escrow for "${listing.title}" (${referenceNumber}).`,
        { escrowId: escrow.id, listingId },
      );

      logger.info({ escrowId: escrow.id, buyerId, listingId }, "Escrow initiated");
      res.status(201).json({ success: true, data: result[0] });
    } catch (err) { next(err); }
  },
);

// ── POST /escrow/:escrowId/payment-intent ─────────────────────────────────────
router.post("/:escrowId/payment-intent", async (req, res, next) => {
  try {
    const buyerId = (req as any).user.id;
    const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.escrowId)).limit(1);
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== buyerId) throw new AppError("Access denied", 403, "FORBIDDEN");
    if (escrow.status !== "INITIATED") throw new AppError("Escrow is not in INITIATED state", 400, "INVALID_STATE");

    // Stripe not configured — stub marks as FUNDED
    const stubClientSecret = `pi_stub_${escrow.id}_secret_test`;
    await db.update(escrowAccounts)
      .set({ stripePaymentIntentId: `pi_stub_${escrow.id}`, status: "FUNDED", updatedAt: new Date() })
      .where(eq(escrowAccounts.id, escrow.id));

    await db.insert(transactions).values({
      escrowId: escrow.id, type: "DEPOSIT", status: "COMPLETED",
      amount: escrow.totalAmount, currency: escrow.currency, processedAt: new Date(),
    });

    // Notify seller
    await notify(
      escrow.sellerId,
      "Escrow Funded 💰",
      `The buyer has funded escrow ${escrow.referenceNumber}. The 14-day inspection period begins now.`,
      { escrowId: escrow.id },
    );

    logger.info({ escrowId: escrow.id }, "Payment intent stub created, escrow marked FUNDED");
    res.json({
      success: true,
      data: { clientSecret: stubClientSecret, amount: Math.round(Number(escrow.totalAmount) * 100), currency: escrow.currency, escrowId: escrow.id },
    });
  } catch (err) { next(err); }
});

// ── POST /escrow/:escrowId/approve-release ────────────────────────────────────
router.post("/:escrowId/approve-release", async (req, res, next) => {
  try {
    const buyerId = (req as any).user.id;
    const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.escrowId)).limit(1);
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== buyerId) throw new AppError("Only the buyer can approve release", 403, "FORBIDDEN");
    if (!["FUNDED", "INSPECTING"].includes(escrow.status))
      throw new AppError("Escrow must be FUNDED or INSPECTING to approve", 400, "INVALID_STATE");

    await db.update(escrowAccounts)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(escrowAccounts.id, escrow.id));

    await notify(
      escrow.sellerId,
      "Release Approved ✅",
      `The buyer has approved fund release for escrow ${escrow.referenceNumber}. Payout is being processed.`,
      { escrowId: escrow.id },
    );

    res.json({ success: true, message: "Release approved. Admin will complete payout." });
  } catch (err) { next(err); }
});

// ── POST /escrow/:escrowId/dispute ─────────────────────────────────────────────
router.post("/:escrowId/dispute",
  validate([body("reason").trim().isLength({ min: 20 })]),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.escrowId)).limit(1);
      if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
      if (escrow.buyerId !== userId && escrow.sellerId !== userId)
        throw new AppError("Access denied", 403, "FORBIDDEN");

      await db.update(escrowAccounts)
        .set({ status: "DISPUTED", notes: req.body.reason, updatedAt: new Date() })
        .where(eq(escrowAccounts.id, escrow.id));

      // Notify the other party
      const otherPartyId = userId === escrow.buyerId ? escrow.sellerId : escrow.buyerId;
      await notify(
        otherPartyId,
        "Dispute Raised ⚠️",
        `A dispute has been raised on escrow ${escrow.referenceNumber}. Our team will review within 48 hours.`,
        { escrowId: escrow.id },
      );

      res.json({ success: true, message: "Dispute raised. Our team will review within 48 hours." });
    } catch (err) { next(err); }
  },
);

export default router;
