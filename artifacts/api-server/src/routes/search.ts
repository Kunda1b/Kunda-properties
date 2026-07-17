import { Router } from "express";
import { db } from "@workspace/db";
import { listings, listingImages } from "@workspace/db/schema";
import { eq, and, or, ilike, gte, lte, sql } from "drizzle-orm";

const router = Router();

const GAMBIA_REGIONS = [
  "Banjul", "Kanifing", "Kombo North", "Kombo South", "Kombo Central",
  "Kombo East", "Brikama", "Kerewan", "Kuntaur", "Georgetown", "Janjanbureh", "Basse",
];

// ── GET /search ───────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const {
      q, propertyType, minPrice, maxPrice, region, area, bedrooms,
      furnished, titleDeedAvailable, isNegotiable, isInstallment, isVerified,
      page = 1, limit = 12, sortBy = "created_at", sortOrder = "desc",
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [eq(listings.status, "ACTIVE")];
    if (q) {
      conditions.push(or(
        ilike(listings.title, `%${q}%`),
        ilike(listings.description, `%${q}%`),
        ilike(listings.address, `%${q}%`),
        ilike(listings.region, `%${q}%`),
      ));
    }
    if (propertyType) conditions.push(eq(listings.propertyType, propertyType as any));
    if (region) conditions.push(ilike(listings.region, `%${region}%`));
    if (area) conditions.push(ilike(listings.area, `%${area}%`));
    if (furnished === "true") conditions.push(eq(listings.furnished, true));
    if (titleDeedAvailable === "true") conditions.push(eq(listings.titleDeedAvailable, true));
    if (isNegotiable === "true") conditions.push(eq(listings.isNegotiable, true));
    if (isInstallment === "true") conditions.push(eq(listings.isInstallment, true));
    if (isVerified === "true") conditions.push(eq(listings.isVerified, true));
    if (bedrooms) conditions.push(eq(listings.bedrooms, Number(bedrooms)));
    if (minPrice) conditions.push(gte(listings.priceUsd, String(minPrice)));
    if (maxPrice) conditions.push(lte(listings.priceUsd, String(maxPrice)));

    const where = and(...conditions);

    const allowedSorts: Record<string, any> = {
      created_at: listings.createdAt, price: listings.price,
      price_usd: listings.priceUsd, view_count: listings.viewCount, published_at: listings.publishedAt,
    };
    const sortCol = allowedSorts[String(sortBy)] ?? listings.createdAt;

    const results = await db.query.listings.findMany({
      where: () => where,
      with: {
        images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 },
        seller: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
      orderBy: (l: any, { asc, desc }: any) => [sortOrder === "asc" ? asc(sortCol) : desc(sortCol)],
      limit: limitNum,
      offset,
    });

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(listings).where(where);

    res.json({
      success: true,
      data: {
        listings: results, total: count, page: pageNum, limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        facets: { regions: GAMBIA_REGIONS },
      },
    });
  } catch (err) { next(err); }
});

// ── GET /search/featured ──────────────────────────────────────────────────────
router.get("/featured", async (req, res, next) => {
  try {
    const results = await db.query.listings.findMany({
      where: (l, { eq: eqFn }) => eqFn(l.status, "ACTIVE"),
      with: {
        images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 },
        seller: { with: { profile: { columns: { firstName: true, lastName: true } } } },
      },
      orderBy: (l, { desc }) => [desc(l.viewCount), desc(l.publishedAt)],
      limit: 8,
    });
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// ── GET /search/stats ─────────────────────────────────────────────────────────
router.get("/stats", async (req, res, next) => {
  try {
    const [{ count: totalActive }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "ACTIVE"));

    const byType = await db
      .select({ propertyType: listings.propertyType, count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "ACTIVE"))
      .groupBy(listings.propertyType);

    const byRegion = await db
      .select({ region: listings.region, count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "ACTIVE"))
      .groupBy(listings.region)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    res.json({ success: true, data: { totalActive, byPropertyType: byType, topRegions: byRegion } });
  } catch (err) { next(err); }
});

// ── GET /search/:id/similar ───────────────────────────────────────────────────
router.get("/:id/similar", async (req, res, next) => {
  try {
    const [listing] = await db.select().from(listings).where(eq(listings.id, req.params.id)).limit(1);
    if (!listing) return res.json({ success: true, data: [] });

    const similar = await db.query.listings.findMany({
      where: (l, { eq: eqFn, and: andFn, ne: neFn }) =>
        andFn(neFn(l.id, listing.id), eqFn(l.status, "ACTIVE"), eqFn(l.propertyType, listing.propertyType), eqFn(l.region, listing.region)),
      with: { images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 } },
      limit: 4,
    });

    res.json({ success: true, data: similar });
  } catch (err) { next(err); }
});

export default router;
