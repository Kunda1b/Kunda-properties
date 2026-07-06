import { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@kunda/database";

const GAMBIA_REGIONS = [
  "Banjul", "Kanifing", "Kombo North", "Kombo South", "Kombo Central",
  "Kombo East", "Brikama", "Kerewan", "Kuntaur", "Georgetown", "Janjanbureh", "Basse",
];

export async function searchListings(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      q, propertyType, minPrice, maxPrice, region, area, bedrooms,
      minBedrooms, maxBedrooms, furnished, features, titleDeedAvailable,
      isNegotiable, isInstallment, page = 1, limit = 12, sortBy = "createdAt", sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: Prisma.ListingWhereInput = { status: "ACTIVE" };

    if (q) {
      where.OR = [
        { title: { contains: String(q), mode: "insensitive" } },
        { description: { contains: String(q), mode: "insensitive" } },
        { area: { contains: String(q), mode: "insensitive" } },
        { address: { contains: String(q), mode: "insensitive" } },
      ];
    }
    if (propertyType) where.propertyType = propertyType as any;
    if (region) where.region = { contains: String(region), mode: "insensitive" };
    if (area) where.area = { contains: String(area), mode: "insensitive" };
    if (furnished === "true") where.furnished = true;
    if (titleDeedAvailable === "true") where.titleDeedAvailable = true;
    if (isNegotiable === "true") where.isNegotiable = true;
    if (isInstallment === "true") where.isInstallment = true;

    if (bedrooms) where.bedrooms = Number(bedrooms);
    else if (minBedrooms || maxBedrooms) {
      where.bedrooms = {};
      if (minBedrooms) (where.bedrooms as any).gte = Number(minBedrooms);
      if (maxBedrooms) (where.bedrooms as any).lte = Number(maxBedrooms);
    }

    if (minPrice || maxPrice) {
      where.priceUsd = {};
      if (minPrice) (where.priceUsd as any).gte = Number(minPrice);
      if (maxPrice) (where.priceUsd as any).lte = Number(maxPrice);
    }

    if (features) {
      where.features = { hasEvery: String(features).split(",").map((f) => f.trim()) };
    }

    const allowedSorts = ["createdAt", "price", "priceUsd", "viewCount", "publishedAt"];
    const safeSort = allowedSorts.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const safeOrder = sortOrder === "asc" ? "asc" : "desc";

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, skip, take: Number(limit),
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          seller: { include: { profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          _count: { select: { savedBy: true } },
        },
        orderBy: { [safeSort]: safeOrder },
      }),
      prisma.listing.count({ where }),
    ]);

    const facets = await prisma.listing.groupBy({
      by: ["propertyType"], where: { ...where, propertyType: undefined }, _count: { propertyType: true },
    });

    res.json({
      success: true,
      data: {
        listings, total, page: Number(page), limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        facets: { propertyTypes: facets.map((f) => ({ type: f.propertyType, count: f._count.propertyType })), regions: GAMBIA_REGIONS },
      },
    });
  } catch (error) { next(error); }
}

export async function getFeaturedListings(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" }, take: 8,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { include: { profile: { select: { firstName: true, lastName: true } } } },
        _count: { select: { savedBy: true } },
      },
    });
    res.json({ success: true, data: listings });
  } catch (error) { next(error); }
}

export async function getSimilarListings(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.json({ success: true, data: [] });

    const similar = await prisma.listing.findMany({
      where: {
        id: { not: id }, status: "ACTIVE", propertyType: listing.propertyType, region: listing.region,
        priceUsd: { gte: Number(listing.priceUsd) * 0.7, lte: Number(listing.priceUsd) * 1.3 },
      },
      take: 4, include: { images: { where: { isPrimary: true }, take: 1 } },
    });
    return res.json({ success: true, data: similar });
  } catch (error) { next(error); }
}

export async function getMarketStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalActive, byType, byRegion, avgPrices] = await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.groupBy({ by: ["propertyType"], where: { status: "ACTIVE" }, _count: true }),
      prisma.listing.groupBy({ by: ["region"], where: { status: "ACTIVE" }, _count: true, orderBy: { _count: { region: "desc" } }, take: 10 }),
      prisma.listing.groupBy({ by: ["propertyType"], where: { status: "ACTIVE", priceUsd: { not: null } }, _avg: { priceUsd: true } }),
    ]);
    res.json({ success: true, data: { totalActive, byPropertyType: byType, topRegions: byRegion, averagePricesByType: avgPrices } });
  } catch (error) { next(error); }
}
