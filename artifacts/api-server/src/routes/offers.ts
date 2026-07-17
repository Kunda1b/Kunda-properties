import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { offers, listings } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";

const router = Router();
router.use(authenticate);

// ── GET /offers/my ────────────────────────────────────────────────────────────
router.get("/my", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { role = "buyer", page = 1, limit = 10 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const myOffers = await db.query.offers.findMany({
      where: (o, { eq: eqFn }) => role === "buyer" ? eqFn(o.buyerId, userId) : undefined,
      with: {
        listing: { with: { images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 } } },
        buyer: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

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

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing || listing.status !== "ACTIVE")
        throw new AppError("Listing not available for offers", 400, "LISTING_UNAVAILABLE");
      if (listing.sellerId === buyerId)
        throw new AppError("Cannot make an offer on your own listing", 400, "OWN_LISTING");

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const [offer] = await db.insert(offers).values({
        listingId, buyerId, amount: String(amount), currency, message: message || null, expiresAt,
      }).returning();

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
    if (action === "accept") {
      updateData = { status: "ACCEPTED", acceptedAt: now, updatedAt: now };
      await db.update(listings).set({ status: "UNDER_OFFER", updatedAt: now }).where(eq(listings.id, offer.listingId));
    } else if (action === "reject") {
      updateData = { status: "REJECTED", rejectedAt: now, updatedAt: now };
    } else if (action === "counter") {
      if (!counterAmount) throw new AppError("Counter amount required", 400, "COUNTER_AMOUNT_REQUIRED");
      updateData = { status: "COUNTERED", counterAmount: String(counterAmount), counterMessage: counterMessage || null, updatedAt: now };
    } else {
      throw new AppError("Invalid action. Use: accept, reject, counter", 400, "INVALID_ACTION");
    }

    const [updated] = await db.update(offers).set(updateData).where(eq(offers.id, offerId)).returning();
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
