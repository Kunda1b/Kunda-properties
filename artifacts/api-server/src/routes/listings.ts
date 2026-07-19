import { Router } from "express";
import { body } from "express-validator";
import slugify from "slugify";
import { db } from "@workspace/db";
import { listings, listingImages, listingVideos, savedListings, priceHistory, exchangeRates } from "@workspace/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { authenticate, requireSellerOrAgent } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { sanitizeText, sanitizeMultiline, sanitizeUrl } from "../lib/sanitize.js";

const router = Router();

// ── GET /listings/:id ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [listing] = await db.query.listings.findMany({
      where: (l, { or, eq: eqFn, ne: neFn, and: andFn, notInArray }) =>
        andFn(
          or(eqFn(l.id, id), eqFn(l.slug, id)),
          neFn(l.status, "DRAFT"),
          neFn(l.status, "WITHDRAWN"),
          neFn(l.status, "SUSPENDED"),
        ),
      with: {
        images: { orderBy: (i, { asc }) => [asc(i.order)] },
        videos: true,
        seller: { with: { profile: true } },
      },
      limit: 1,
    }) as any[];

    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    // Atomic view count increment — avoids read-then-write race condition under concurrent requests
    db.update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, listing.id))
      .catch((err) => logger.warn({ err, listingId: listing.id }, "view count increment failed"));
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
    const whereClause = status
      ? and(eq(listings.sellerId, userId), eq(listings.status, status as any))
      : eq(listings.sellerId, userId);

    const [results, [{ total }]] = await Promise.all([
      db.query.listings.findMany({
        where: () => whereClause,
        with: { images: true },
        orderBy: (l, { desc }) => [desc(l.updatedAt)],
        limit: limitNum,
        offset,
      }),
      db.select({ total: sql<number>`count(*)::int` }).from(listings).where(whereClause),
    ]);

    res.json({ success: true, data: { listings: results, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (err) { next(err); }
});

// ── POST /listings ─────────────────────────────────────────────────────────────
router.post(
  "/",
  requireSellerOrAgent,
  validate([
    body("title").trim().isLength({ min: 10, max: 200 }),
    body("description").trim().isLength({ min: 20, max: 20000 }),
    body("propertyType").isIn(["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "VILLA", "COMPOUND"]),
    body("price").isNumeric(),
    body("currency").isIn(["GMD", "USD", "GBP", "EUR"]),
    body("address").trim().notEmpty().isLength({ max: 300 }),
    body("region").trim().notEmpty().isLength({ max: 100 }),
  ]),
  async (req, res, next) => {
    try {
      const sellerId = req.user!.id;
      const title = sanitizeText(req.body.title, 200);
      const description = sanitizeMultiline(req.body.description, 20000);
      const address = sanitizeText(req.body.address, 300);
      const region = sanitizeText(req.body.region, 100);
      const { propertyType, price, currency, area,
        latitude, longitude, bedrooms, bathrooms, toilets, landSizeSqm, buildingSizeSqm,
        yearBuilt, floors, features, furnished, hasElectricity, hasWater, hasInternet,
        hasSecurity, titleDeedAvailable, titleDeedNumber, isNegotiable, isInstallment,
        installmentYears, diasporaHighlights, virtualTourUrl } = req.body;

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
        diasporaHighlights: Array.isArray(diasporaHighlights)
          ? diasporaHighlights.map((h: unknown) => sanitizeText(h, 200)).filter(Boolean)
          : [],
        virtualTourUrl: virtualTourUrl ? sanitizeUrl(virtualTourUrl) : null,
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
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!existing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (existing.sellerId !== userId && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")
      throw new AppError("Access denied", 403, "FORBIDDEN");

    const { propertyType, price, currency, area,
      bedrooms, bathrooms, furnished, features, diasporaHighlights, isNegotiable,
      isInstallment, installmentYears, titleDeedAvailable, titleDeedNumber,
      latitude, longitude } = req.body;

    const title = req.body.title != null ? sanitizeText(req.body.title, 200) : undefined;
    const description = req.body.description != null ? sanitizeMultiline(req.body.description, 20000) : undefined;
    const address = req.body.address != null ? sanitizeText(req.body.address, 300) : undefined;
    const region = req.body.region != null ? sanitizeText(req.body.region, 100) : undefined;
    const virtualTourUrl = req.body.virtualTourUrl !== undefined
      ? (req.body.virtualTourUrl ? sanitizeUrl(req.body.virtualTourUrl) : null)
      : undefined;

    // Recalculate priceUsd when price or currency changes
    let recalcPriceUsd: string | undefined;
    if (price !== undefined || currency) {
      const effectivePrice = price !== undefined ? Number(price) : Number(existing.price);
      const effectiveCurrency = currency || existing.currency;
      if (effectiveCurrency === "USD") {
        recalcPriceUsd = String(effectivePrice);
      } else {
        const [rateRow] = await db.select({ rate: exchangeRates.rate })
          .from(exchangeRates)
          .where(and(
            eq(exchangeRates.fromCurrency, effectiveCurrency),
            eq(exchangeRates.toCurrency, "USD"),
          )).limit(1);
        if (rateRow) recalcPriceUsd = String(effectivePrice * Number(rateRow.rate));
      }
    }

    const [updated] = await db.update(listings).set({
      ...(title && { title }), ...(description && { description }),
      ...(propertyType && { propertyType }),
      ...(price !== undefined && { price: String(price) }),
      ...(currency && { currency }),
      ...(recalcPriceUsd !== undefined && { priceUsd: recalcPriceUsd }),
      ...(address && { address }), ...(region && { region }),
      ...(area !== undefined && { area: area ? sanitizeText(area, 100) : area }),
      ...(latitude !== undefined && { latitude: String(latitude) }),
      ...(longitude !== undefined && { longitude: String(longitude) }),
      ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
      ...(bathrooms !== undefined && { bathrooms: Number(bathrooms) }),
      ...(furnished !== undefined && { furnished }),
      ...(features && { features: Array.isArray(features) ? features.map((f: unknown) => sanitizeText(f, 100)) : features }),
      ...(diasporaHighlights && {
        diasporaHighlights: Array.isArray(diasporaHighlights)
          ? diasporaHighlights.map((h: unknown) => sanitizeText(h, 200))
          : diasporaHighlights,
      }),
      ...(isNegotiable !== undefined && { isNegotiable }),
      ...(isInstallment !== undefined && { isInstallment }),
      ...(installmentYears !== undefined && { installmentYears: Number(installmentYears) }),
      ...(titleDeedAvailable !== undefined && { titleDeedAvailable }),
      ...(titleDeedNumber !== undefined && { titleDeedNumber: titleDeedNumber ? sanitizeText(titleDeedNumber, 100) : titleDeedNumber }),
      ...(virtualTourUrl !== undefined && { virtualTourUrl }),
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

    const [listing] = await db.select({ sellerId: listings.sellerId }).from(listings).where(eq(listings.id, id)).limit(1);
    if (!listing) return res.status(404).json({ success: false, error: "Listing not found" });
    const userRole = (req as any).user.role;
    if (listing.sellerId !== (req as any).user.id && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")
      return res.status(403).json({ success: false, error: "Access denied" });

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
    const [listing] = await db.select({ sellerId: listings.sellerId }).from(listings).where(eq(listings.id, req.params.id)).limit(1);
    if (!listing) return res.status(404).json({ success: false, error: "Listing not found" });
    const userRole = (req as any).user.role;
    if (listing.sellerId !== (req as any).user.id && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")
      return res.status(403).json({ success: false, error: "Access denied" });
    await db.delete(listingImages).where(
      and(eq(listingImages.id, req.params.imageId), eq(listingImages.listingId, req.params.id)),
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
