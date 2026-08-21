import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { escrowAccounts, escrowMilestones, transactions, listings, offers, kycRecords, users, exchangeRates } from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { notify } from "../lib/notify.js";
import { getStripe } from "../lib/stripe.js";
import { escrowLimiter } from "../middleware/rateLimiters.js";
import { writeAudit } from "../lib/audit.js";
import { sanitizeMultiline } from "../lib/sanitize.js";

const router = Router();
router.use(authenticate);

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "2.5");

function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

async function toStripeAmount(amount: number, currency: string): Promise<{ amount: number; currency: string }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Escrow amount must be positive", 400, "INVALID_AMOUNT");
  }
  if (currency === "USD") return { amount: Math.round(amount * 100), currency: "usd" };

  const [rate] = await db.select({ rate: exchangeRates.rate })
    .from(exchangeRates)
    .where(and(eq(exchangeRates.fromCurrency, currency), eq(exchangeRates.toCurrency, "USD")))
    .limit(1);
  if (!rate || Number(rate.rate) <= 0) {
    throw new AppError(`No exchange rate available for ${currency}/USD`, 503, "EXCHANGE_RATE_UNAVAILABLE");
  }
  return { amount: Math.round(amount * Number(rate.rate) * 100), currency: "usd" };
}

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
  escrowLimiter,
  validate([body("listingId").notEmpty().isLength({ max: 64 })]),
  async (req, res, next) => {
    try {
      const buyerId = req.user!.id;
      const { listingId, offerId } = req.body;

      const [kyc] = await db.select({ status: kycRecords.status })
        .from(kycRecords).where(eq(kycRecords.userId, buyerId)).limit(1);
      if (!kyc || kyc.status !== "VERIFIED") {
        throw new AppError(
          "Identity verification required before initiating escrow. Please complete KYC.",
          403, "KYC_REQUIRED",
        );
      }

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing || listing.status !== "ACTIVE")
        throw new AppError("Listing not available", 400, "LISTING_UNAVAILABLE");
      if (!Number.isFinite(Number(listing.price)) || Number(listing.price) <= 0)
        throw new AppError("Listing has an invalid price", 400, "INVALID_AMOUNT");
      if (listing.sellerId === buyerId)
        throw new AppError("Cannot initiate escrow on your own listing", 400, "OWN_LISTING");

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
        if (!offer || offer.status !== "ACCEPTED" || offer.buyerId !== buyerId || offer.listingId !== listingId)
          throw new AppError("Invalid or unaccepted offer", 400, "OFFER_INVALID");
        if (offer.expiresAt <= new Date())
          throw new AppError("Offer has expired", 400, "OFFER_EXPIRED");
        finalAmount = Number(offer.amount);
        finalCurrency = offer.currency;
      }

      const platformFeeAmount = (finalAmount * PLATFORM_FEE_PERCENT) / 100;
      const sellerPayoutAmount = finalAmount - platformFeeAmount;
      const inspectionDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      if (!Number.isFinite(finalAmount) || finalAmount <= 0)
        throw new AppError("Escrow amount must be positive", 400, "INVALID_AMOUNT");
      const referenceNumber = `KND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

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

      await notify(
        listing.sellerId,
        "Escrow Initiated",
        `A buyer has initiated escrow for "${listing.title}" (${referenceNumber}).`,
        { escrowId: escrow.id, listingId },
      );

      await writeAudit(req, {
        action: "ESCROW_INITIATE",
        resource: "escrow",
        resourceId: escrow.id,
        newValues: { listingId, offerId: offerId || null, totalAmount: finalAmount, currency: finalCurrency },
      });

      logger.info({ escrowId: escrow.id, buyerId, listingId }, "Escrow initiated");
      res.status(201).json({ success: true, data: result[0] });
    } catch (err) { next(err); }
  },
);

// ── POST /escrow/:escrowId/payment-intent ─────────────────────────────────────
router.post("/:escrowId/payment-intent", escrowLimiter, async (req, res, next) => {
  try {
    const buyerId = req.user!.id;
    const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.escrowId)).limit(1);
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== buyerId) throw new AppError("Access denied", 403, "FORBIDDEN");
    if (escrow.status !== "INITIATED") throw new AppError("Escrow is not in INITIATED state", 400, "INVALID_STATE");

    if (!isStripeConfigured()) {
      logger.warn({ escrowId: escrow.id }, "Payment attempted but Stripe is not configured");
      return res.status(503).json({
        success: false,
        error: "Payment provider is not configured. The platform administrator needs to set STRIPE_SECRET_KEY to enable real payments.",
        code: "PAYMENT_NOT_CONFIGURED",
      });
    }

    // Real Stripe flow. Reuse an existing PaymentIntent so retries cannot create
    // multiple authorizations for the same escrow.
    const stripe = getStripe();
    if (escrow.stripePaymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(escrow.stripePaymentIntentId);
      if (existingIntent.status !== "canceled") {
        return res.json({
          success: true,
          data: {
            clientSecret: existingIntent.client_secret,
            amount: existingIntent.amount,
            currency: existingIntent.currency,
            escrowId: escrow.id,
            mode: "live",
            requiresConfirmation: existingIntent.status === "requires_payment_method" || existingIntent.status === "requires_confirmation",
          },
        });
      }
    }

    // Get or create Stripe customer for buyer
    const [buyer] = await db.select().from(users).where(eq(users.id, buyerId)).limit(1);
    let stripeCustomerId = buyer!.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: buyer!.email,
        metadata: { userId: buyerId },
      });
      stripeCustomerId = customer.id;
      await db.update(users).set({ stripeCustomerId }).where(eq(users.id, buyerId));
    }

    // Get seller's Stripe account (for Connect destination charges)
    const [seller] = await db.select().from(users).where(eq(users.id, escrow.sellerId)).limit(1);

    const stripeAmount = await toStripeAmount(Number(escrow.totalAmount), escrow.currency);
    const stripeFee = await toStripeAmount(Number(escrow.platformFeeAmount), escrow.currency);
    const amountInCents = stripeAmount.amount;
    const feeInCents = stripeFee.amount;
    const sellerAmountInCents = amountInCents - feeInCents;

    const paymentIntentParams: any = {
      amount: amountInCents,
      currency: stripeAmount.currency,
      customer: stripeCustomerId,
      capture_method: "manual",
      metadata: {
        escrowId: escrow.id,
        referenceNumber: escrow.referenceNumber,
        listingId: escrow.listingId,
      },
      description: `Escrow ${escrow.referenceNumber} - ${escrow.listingId}`,
    };

    // If seller has a Stripe Connect account, use destination charges
    if (seller?.stripeAccountId) {
      paymentIntentParams.transfer_data = {
        destination: seller.stripeAccountId,
        amount: sellerAmountInCents,
      };
      paymentIntentParams.application_fee_amount = feeInCents;
      paymentIntentParams.on_behalf_of = seller.stripeAccountId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, {
      idempotencyKey: `escrow-payment-${escrow.id}`,
    });

    await db.update(escrowAccounts)
      .set({
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: new Date(),
      })
      .where(eq(escrowAccounts.id, escrow.id));

    // Transaction is created on webhook confirmation, not on PI creation
    // Funds are authorized but not captured until buyer approves release

    logger.info({ escrowId: escrow.id, paymentIntent: paymentIntent.id }, "Payment intent created");
    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: amountInCents,
        currency: paymentIntent.currency,
        escrowId: escrow.id,
        mode: "live",
        requiresConfirmation: true,
      },
    });
  } catch (err) { next(err); }
});

// ── POST /escrow/:escrowId/approve-release ────────────────────────────────────
router.post("/:escrowId/approve-release", escrowLimiter, async (req, res, next) => {
  try {
    const buyerId = req.user!.id;
    const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.escrowId)).limit(1);
    if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
    if (escrow.buyerId !== buyerId) throw new AppError("Only the buyer can approve release", 403, "FORBIDDEN");
    if (!["FUNDED", "INSPECTING"].includes(escrow.status))
      throw new AppError("Escrow must be FUNDED or INSPECTING to approve", 400, "INVALID_STATE");

    if (!isStripeConfigured() || !escrow.stripePaymentIntentId) {
      throw new AppError("Escrow has no verified Stripe payment", 409, "PAYMENT_NOT_VERIFIED");
    }

    // Capture first. Never mark an escrow approved if Stripe did not capture it.
    const stripe = getStripe();
    try {
      await stripe.paymentIntents.capture(escrow.stripePaymentIntentId);
      logger.info({ escrowId: escrow.id }, "Payment intent captured");
    } catch (stripeErr: any) {
      logger.warn({ escrowId: escrow.id, error: stripeErr.message }, "Stripe capture failed");
      throw new AppError("Payment capture failed; escrow was not approved", 502, "PAYMENT_CAPTURE_FAILED");
    }

    const previousStatus = escrow.status;
    const [updatedEscrow] = await db.update(escrowAccounts)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(and(eq(escrowAccounts.id, escrow.id), inArray(escrowAccounts.status, ["FUNDED", "INSPECTING"])))
      .returning({ id: escrowAccounts.id });
    if (!updatedEscrow) throw new AppError("Escrow state changed; please retry", 409, "INVALID_STATE");

    await writeAudit(req, {
      action: "ESCROW_APPROVE_RELEASE",
      resource: "escrow",
      resourceId: escrow.id,
      oldValues: { status: previousStatus },
      newValues: { status: "APPROVED" },
    });

    await notify(escrow.sellerId, "Release Approved ✅",
      `The buyer has approved fund release for escrow ${escrow.referenceNumber}. Payout is being processed.`,
      { escrowId: escrow.id },
    );

    res.json({ success: true, message: "Release approved. Admin will complete payout." });
  } catch (err) { next(err); }
});

// ── POST /escrow/:escrowId/dispute ─────────────────────────────────────────────
router.post("/:escrowId/dispute",
  escrowLimiter,
  validate([body("reason").trim().isLength({ min: 20, max: 5000 })]),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.escrowId)).limit(1);
      if (!escrow) throw new AppError("Escrow not found", 404, "NOT_FOUND");
      if (escrow.buyerId !== userId && escrow.sellerId !== userId)
        throw new AppError("Access denied", 403, "FORBIDDEN");

      const reason = sanitizeMultiline(req.body.reason, 5000);
      const previousStatus = escrow.status;

      await db.update(escrowAccounts)
        .set({ status: "DISPUTED", notes: reason, updatedAt: new Date() })
        .where(eq(escrowAccounts.id, escrow.id));

      await writeAudit(req, {
        action: "ESCROW_DISPUTE",
        resource: "escrow",
        resourceId: escrow.id,
        oldValues: { status: previousStatus },
        newValues: { status: "DISPUTED", reason },
      });

      const otherPartyId = userId === escrow.buyerId ? escrow.sellerId : escrow.buyerId;
      await notify(otherPartyId, "Dispute Raised ⚠️",
        `A dispute has been raised on escrow ${escrow.referenceNumber}. Our team will review within 48 hours.`,
        { escrowId: escrow.id },
      );

      res.json({ success: true, message: "Dispute raised. Our team will review within 48 hours." });
    } catch (err) { next(err); }
  },
);

export default router;
