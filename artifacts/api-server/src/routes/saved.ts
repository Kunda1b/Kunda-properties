import { Router } from "express";
import { db } from "@workspace/db";
import { savedListings, listings } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// ── GET /saved ────────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const saved = await db.query.savedListings.findMany({
      where: (s, { eq: eqFn }) => eqFn(s.userId, userId),
      with: { listing: { with: { images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 } } } },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
    res.json({ success: true, data: saved });
  } catch (err) { next(err); }
});

// ── POST /saved/:listingId ────────────────────────────────────────────────────
router.post("/:listingId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { listingId } = req.params;
    const [existing] = await db.select().from(savedListings)
      .where(and(eq(savedListings.userId, userId), eq(savedListings.listingId, listingId))).limit(1);

    if (!existing) {
      await db.insert(savedListings).values({ userId, listingId });
      await db.update(listings)
        .set({ savedCount: sql`${listings.savedCount} + 1` })
        .where(eq(listings.id, listingId)).catch(() => {});
    }

    res.status(201).json({ success: true });
  } catch (err) { next(err); }
});

// ── DELETE /saved/:listingId ──────────────────────────────────────────────────
router.delete("/:listingId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { listingId } = req.params;
    await db.delete(savedListings)
      .where(and(eq(savedListings.userId, userId), eq(savedListings.listingId, listingId)));
    await db.update(listings)
      .set({ savedCount: sql`greatest(${listings.savedCount} - 1, 0)` })
      .where(eq(listings.id, listingId)).catch(() => {});
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
