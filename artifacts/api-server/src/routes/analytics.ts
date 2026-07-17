import { Router } from "express";
import { db } from "@workspace/db";
import { listingAnalytics, listings } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// ── GET /analytics/listings/:listingId ────────────────────────────────────────
router.get("/listings/:listingId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { listingId } = req.params;

    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing) return res.status(404).json({ success: false, error: "Not found" });
    if (listing.sellerId !== userId) return res.status(403).json({ success: false, error: "Forbidden" });

    const [daily] = await db.execute(
      sql`SELECT
        COALESCE(SUM(view_count), 0)::int as total_views,
        COALESCE(SUM(saved_count), 0)::int as total_saves,
        COALESCE(SUM(enquiry_count), 0)::int as total_enquiries,
        COALESCE(SUM(offer_count), 0)::int as total_offers
      FROM listing_analytics WHERE listing_id = ${listingId}`
    );

    res.json({
      success: true,
      data: {
        listingId,
        title: listing.title,
        viewCount: listing.viewCount,
        savedCount: listing.savedCount,
        enquiryCount: listing.enquiryCount,
        aggregated: daily,
      },
    });
  } catch (err) { next(err); }
});

// ── POST /analytics/track-view ────────────────────────────────────────────────
router.post("/track-view", async (req, res, next) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ success: false, error: "listingId required" });

    await db.update(listings)
      .set({ viewCount: sql`view_count + 1` })
      .where(eq(listings.id, listingId));

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
