import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { offers, listings, kycRecords } from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { notify } from "../lib/notify.js";

const router = Router();
router.use(authenticate);

// ── GET /offers/my ────────────────────────────────────────────────────────────
router.get("/my", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { role = "buyer", page = 1, limit = 10 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    let myOffers: any[];

    if (role === "seller") {
      // Get IDs of listings owned by this seller
      const sellerListings = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.sellerId, userId));
      const listingIds = sellerListings.map((l) => l.id);

      if (listingIds.length === 0) {
        return res.json({ success: true, data: { offers: [], page: pageNum, limit: limitNum } });
      }

      myOffers = await db.query.offers.findMany({
        where: (o, { inArray: inArrayFn }) => inArrayFn(o.listingId, listingIds),
        with: {
          listing: {
            with: { images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 } },
          },
          buyer: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
        },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
      });
    } else {
      myOffers = await db.query.offers.findMany({
        where: (o, { eq: eqFn }) => eqFn(o.buyerId, userId),
        with: {
          listing: {
            with: { images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 } },
          },
          buyer: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
        },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
      });
    }

    res.json({ success: true, data: { offers: myOffers, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

// ── POST /offers ──────────────────────────────────────────────────────────────
router.post(
  "/",
  validate([
    body("listingId").notEmpty(),
    body("amount").isNumeric().isFloat({ min: 0 }),
    body("currency").isIn(["GMD", "USD", "GBP", "EUR"]),
  ]),
  async (req, res, next) => {
    try {
      const buyerId = (req as any).user.id;
      const { listingId, amount, currency, message } = req.body;

      // KYC gate: buyer must be verified
      const [kyc] = await db.select({ status: kycRecords.status })
        .from(kycRecords).where(eq(kycRecords.userId, buyerId)).limit(1);
      if (!kyc || kyc.status !== "VERIFIED") {
        throw new AppError(
          "Identity verification required before making offers. Please complete KYC.",
          403,
          "KYC_REQUIRED",
        );
      }

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing || listing.status !== "ACTIVE")
        throw new AppError("Listing not available for offers", 400, "LISTING_UNAVAILABLE");
      if (listing.sellerId === buyerId)
        throw new AppError("Cannot make an offer on your own listing", 400, "OWN_LISTING");

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const [offer] = await db.insert(offers).values({
        listingId, buyerId, amount: String(amount), currency, message: message || null, expiresAt,
      }).returning();

      // Notify seller
      await notify(
        listing.sellerId,
        "New Offer Received",
        `You have a new ${currency} ${Number(amount).toLocaleString()} offer on "${listing.title}".`,
        { offerId: offer.id, listingId },
      );

      res.status(201).json({ success: true, data: offer });
    } catch (err) { next(err); }
  },
);

// ── PATCH /offers/:offerId/respond ────────────────────────────────────────────
router.patch("/:offerId/respond", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { offerId } = req.params;
    const { action, counterAmount, counterMessage } = req.body;

    const [offer] = await db.query.offers.findMany({
      where: (o, { eq: eqFn }) => eqFn(o.id, offerId),
      with: { listing: true },
      limit: 1,
    }) as any[];

    if (!offer) throw new AppError("Offer not found", 404, "NOT_FOUND");
    if (offer.listing.sellerId !== userId) throw new AppError("Only the seller can respond", 403, "FORBIDDEN");
    if (offer.status !== "PENDING") throw new AppError("Offer is no longer pending", 400, "INVALID_STATE");

    const now = new Date();
    let updateData: any = {};
    let notifTitle = "";
    let notifBody = "";

    if (action === "accept") {
      updateData = { status: "ACCEPTED", acceptedAt: now, updatedAt: now };
      await db.update(listings).set({ status: "UNDER_OFFER", updatedAt: now }).where(eq(listings.id, offer.listingId));
      notifTitle = "Offer Accepted 🎉";
      notifBody = `Your offer on "${offer.listing.title}" has been accepted! You can now proceed to escrow.`;
    } else if (action === "reject") {
      updateData = { status: "REJECTED", rejectedAt: now, updatedAt: now };
      notifTitle = "Offer Not Accepted";
      notifBody = `Your offer on "${offer.listing.title}" was not accepted.`;
    } else if (action === "counter") {
      if (!counterAmount) throw new AppError("Counter amount required", 400, "COUNTER_AMOUNT_REQUIRED");
      updateData = { status: "COUNTERED", counterAmount: String(counterAmount), counterMessage: counterMessage || null, updatedAt: now };
      notifTitle = "Counter-Offer Received";
      notifBody = `The seller has made a counter-offer of ${offer.currency} ${Number(counterAmount).toLocaleString()} on "${offer.listing.title}".`;
    } else {
      throw new AppError("Invalid action. Use: accept, reject, counter", 400, "INVALID_ACTION");
    }

    const [updated] = await db.update(offers).set(updateData).where(eq(offers.id, offerId)).returning();

    if (notifTitle) {
      await notify(offer.buyerId, notifTitle, notifBody, { offerId: offer.id, listingId: offer.listingId });
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
