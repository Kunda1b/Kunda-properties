import { Router } from "express";
import { body } from "express-validator";
import slugify from "slugify";
import { db } from "@workspace/db";
import { listings, listingImages, listingVideos, savedListings, priceHistory } from "@workspace/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ── GET /listings/:id ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [listing] = await db.query.listings.findMany({
      where: (l, { or, eq: eqFn, ne: neFn }) =>
        and(
          or(eqFn(l.id, id), eqFn(l.slug, id)),
          neFn(l.status, "DRAFT"),
        ),
      with: {
        images: { orderBy: (i, { asc }) => [asc(i.order)] },
        videos: true,
        seller: { with: { profile: true } },
      },
      limit: 1,
    }) as any[];

    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    // Increment view count in background
    db.update(listings).set({ viewCount: listing.viewCount + 1 }).where(eq(listings.id, listing.id)).catch(() => {});
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
});

// ── Auth required below ───────────────────────────────────────────────────────
router.use(authenticate);

// ── GET /listings/my/all ──────────────────────────────────────────────────────
router.get("/my/all", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const where: any = eq(listings.sellerId, userId);
    const results = await db.query.listings.findMany({
      where: (l, { eq: eqFn, and: andFn }) =>
        status ? andFn(eqFn(l.sellerId, userId), eqFn(l.status, status as any)) : eqFn(l.sellerId, userId),
      with: { images: true },
      orderBy: (l, { desc }) => [desc(l.updatedAt)],
      limit: limitNum,
      offset,
    });

    res.json({ success: true, data: { listings: results, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

// ── POST /listings ─────────────────────────────────────────────────────────────
router.post(
  "/",
  validate([
    body("title").trim().isLength({ min: 10, max: 200 }),
    body("description").trim().isLength({ min: 20 }),
    body("propertyType").isIn(["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "VILLA", "COMPOUND"]),
    body("price").isNumeric(),
    body("currency").isIn(["GMD", "USD", "GBP", "EUR"]),
    body("address").trim().notEmpty(),
    body("region").trim().notEmpty(),
  ]),
  async (req, res, next) => {
    try {
      const sellerId = (req as any).user.id;
      const { title, description, propertyType, price, currency, address, region, area,
        latitude, longitude, bedrooms, bathrooms, toilets, landSizeSqm, buildingSizeSqm,
        yearBuilt, floors, features, furnished, hasElectricity, hasWater, hasInternet,
        hasSecurity, titleDeedAvailable, titleDeedNumber, isNegotiable, isInstallment,
        installmentYears, diasporaHighlights } = req.body;

      // Generate unique slug
      let slug = slugify(`${title} ${region}`, { lower: true, strict: true });
      let attempt = 0;
      while (true) {
        const [exists] = await db.select({ id: listings.id }).from(listings).where(eq(listings.slug, slug)).limit(1);
        if (!exists) break;
        slug = slugify(`${title} ${region}`, { lower: true, strict: true }) + `-${++attempt}`;
      }

      const [listing] = await db.insert(listings).values({
        sellerId, title, slug, description, propertyType, status: "DRAFT",
        price: String(price), currency, priceUsd: currency === "USD" ? String(price) : null,
        address, region, area: area || null, latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        toilets: toilets ? Number(toilets) : null,
        landSizeSqm: landSizeSqm ? String(landSizeSqm) : null,
        buildingSizeSqm: buildingSizeSqm ? String(buildingSizeSqm) : null,
        yearBuilt: yearBuilt ? Number(yearBuilt) : null,
        floors: floors ? Number(floors) : null,
        features: features || [],
        furnished: furnished || false, hasElectricity: hasElectricity || false,
        hasWater: hasWater || false, hasInternet: hasInternet || false,
        hasSecurity: hasSecurity || false, titleDeedAvailable: titleDeedAvailable || false,
        titleDeedNumber: titleDeedNumber || null,
        isNegotiable: isNegotiable || false, isInstallment: isInstallment || false,
        installmentYears: installmentYears ? Number(installmentYears) : null,
        diasporaHighlights: diasporaHighlights || [],
      }).returning();

      logger.info({ listingId: listing.id, sellerId }, "Listing created");
      res.status(201).json({ success: true, data: listing });
    } catch (err) { next(err); }
  },
);

// ── PATCH /listings/:id ───────────────────────────────────────────────────────
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!existing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (existing.sellerId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")
      throw new AppError("Access denied", 403, "FORBIDDEN");

    const { title, description, propertyType, price, currency, address, region, area,
      bedrooms, bathrooms, furnished, features, diasporaHighlights, isNegotiable,
      isInstallment, installmentYears, titleDeedAvailable, titleDeedNumber } = req.body;

    const [updated] = await db.update(listings).set({
      ...(title && { title }), ...(description && { description }),
      ...(propertyType && { propertyType }),
      ...(price !== undefined && { price: String(price) }),
      ...(currency && { currency }),
      ...(address && { address }), ...(region && { region }),
      ...(area !== undefined && { area }),
      ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
      ...(bathrooms !== undefined && { bathrooms: Number(bathrooms) }),
      ...(furnished !== undefined && { furnished }),
      ...(features && { features }),
      ...(diasporaHighlights && { diasporaHighlights }),
      ...(isNegotiable !== undefined && { isNegotiable }),
      ...(isInstallment !== undefined && { isInstallment }),
      ...(installmentYears !== undefined && { installmentYears: Number(installmentYears) }),
      ...(titleDeedAvailable !== undefined && { titleDeedAvailable }),
      ...(titleDeedNumber !== undefined && { titleDeedNumber }),
      updatedAt: new Date(),
    }).where(eq(listings.id, id)).returning();

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── POST /listings/:id/submit-review ──────────────────────────────────────────
router.post("/:id/submit-review", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");

    const images = await db.select({ id: listingImages.id }).from(listingImages)
      .where(eq(listingImages.listingId, id)).limit(1);
    // Don't block if no images yet — sellers can submit without photos in this version
    const [updated] = await db.update(listings)
      .set({ status: "PENDING_REVIEW", updatedAt: new Date() })
      .where(eq(listings.id, id)).returning();

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// ── DELETE /listings/:id ──────────────────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")
      throw new AppError("Access denied", 403, "FORBIDDEN");

    await db.update(listings).set({ status: "WITHDRAWN", updatedAt: new Date() }).where(eq(listings.id, id));
    res.json({ success: true, message: "Listing withdrawn" });
  } catch (err) { next(err); }
});

// ── POST /listings/:id/images ─────────────────────────────────────────────────
router.post("/:id/images", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, thumbnailUrl, caption, isPrimary, order } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "url is required" });

    if (isPrimary) {
      await db.update(listingImages).set({ isPrimary: false }).where(eq(listingImages.listingId, id));
    }

    const [image] = await db.insert(listingImages).values({
      listingId: id, url, thumbnailUrl: thumbnailUrl || null, caption: caption || null,
      isPrimary: isPrimary || false, order: order || 0,
    }).returning();

    res.status(201).json({ success: true, data: image });
  } catch (err) { next(err); }
});

// ── DELETE /listings/:id/images/:imageId ─────────────────────────────────────
router.delete("/:id/images/:imageId", async (req, res, next) => {
  try {
    await db.delete(listingImages).where(
      and(eq(listingImages.id, req.params.imageId), eq(listingImages.listingId, req.params.id)),
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
