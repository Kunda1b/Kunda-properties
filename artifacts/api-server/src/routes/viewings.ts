import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { viewingRequests, listings } from "@workspace/db/schema";
import { eq, and, or } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { notify } from "../lib/notify.js";

const router = Router();
router.use(authenticate);

// ── GET /viewings ─────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const requests = await db.query.viewingRequests.findMany({
      where: (v, { or: orFn, eq: eqFn }) => orFn(eqFn(v.buyerId, userId), eqFn(v.sellerId, userId)),
      with: {
        listing: { columns: { title: true, slug: true, address: true, region: true } },
        buyer: { with: { profile: { columns: { firstName: true, lastName: true } } } },
        seller: { with: { profile: { columns: { firstName: true, lastName: true } } } },
      },
      orderBy: (v, { desc }) => [desc(v.createdAt)],
    });
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
});

// ── POST /viewings ────────────────────────────────────────────────────────────
router.post(
  "/",
  validate([
    body("listingId").notEmpty(),
    body("type").isIn(["IN_PERSON", "VIRTUAL"]),
    body("preferredDate").isISO8601(),
  ]),
  async (req, res, next) => {
    try {
      const buyerId = (req as any).user.id;
      const { listingId, type, preferredDate, preferredTime, message } = req.body;

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
      if (listing.sellerId === buyerId)
        throw new AppError("Cannot request a viewing on your own listing", 400, "OWN_LISTING");

      const [request] = await db.insert(viewingRequests).values({
        listingId, buyerId, sellerId: listing.sellerId,
        type: type || "IN_PERSON",
        preferredDate: new Date(preferredDate),
        preferredTime: preferredTime || null,
        message: message || null,
      }).returning();

      const result = await db.query.viewingRequests.findMany({
        where: (v, { eq: eqFn }) => eqFn(v.id, request.id),
        with: {
          listing: { columns: { title: true } },
          buyer: { with: { profile: { columns: { firstName: true, lastName: true } } } },
        },
        limit: 1,
      });

      await notify(
        listing.sellerId,
        "Viewing Request",
        `${result[0]?.buyer?.profile?.firstName || "A buyer"} requested a ${type.toLowerCase()} viewing for "${listing.title}"`,
        { viewingRequestId: request.id, listingId },
      );

      logger.info({ viewingRequestId: request.id, listingId }, "Viewing request created");
      res.status(201).json({ success: true, data: result[0] });
    } catch (err) { next(err); }
  },
);

// ── PATCH /viewings/:id/respond ───────────────────────────────────────────────
router.patch(
  "/:id/respond",
  validate([
    body("status").isIn(["APPROVED", "DECLINED", "RESCHEDULED"]),
  ]),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const { status, scheduledDate, scheduledTime, meetingLink, notes } = req.body;

      const [vr] = await db.select().from(viewingRequests).where(eq(viewingRequests.id, req.params.id)).limit(1);
      if (!vr) throw new AppError("Viewing request not found", 404, "NOT_FOUND");
      if (vr.sellerId !== userId) throw new AppError("Only the seller can respond", 403, "FORBIDDEN");

      await db.update(viewingRequests)
        .set({
          status,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : vr.preferredDate,
          scheduledTime: scheduledTime || vr.preferredTime,
          meetingLink: meetingLink || null,
          notes: notes || null,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(viewingRequests.id, vr.id));

      await notify(
        vr.buyerId,
        `Viewing ${status === "APPROVED" ? "Confirmed" : status === "DECLINED" ? "Declined" : "Rescheduled"}`,
        `Your viewing request has been ${status.toLowerCase()}`,
        { viewingRequestId: vr.id },
      );

      res.json({ success: true, message: `Viewing ${status.toLowerCase()}` });
    } catch (err) { next(err); }
  },
);

export default router;
