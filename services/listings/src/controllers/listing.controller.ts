import { Request, Response, NextFunction } from "express";
import slugify from "slugify";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { convertCurrency, getExchangeRates } from "../utils/currency";

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const sellerId = (req as any).user.id;
    const {
      title, description, propertyType, price, currency, address,
      region, area, latitude, longitude, bedrooms, bathrooms, toilets,
      landSizesqm, buildingSizesqm, yearBuilt, floors, features,
      furnished, hasElectricity, hasWater, hasInternet, hasSecurity,
      titleDeedAvailable, titleDeedNumber, isNegotiable, isInstallment,
      installmentYears, diasporaHighlights,
    } = req.body;

    const baseSlug = slugify(`${title} ${region}`, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 0;
    while (await prisma.listing.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++count}`;
    }

    const rates = await getExchangeRates();
    const priceUsd = convertCurrency(Number(price), currency, "USD", rates);

    const listing = await prisma.listing.create({
      data: {
        sellerId, title, slug, description, propertyType, price, currency,
        priceUsd, address, region, area, latitude, longitude, bedrooms,
        bathrooms, toilets, landSizesqm, buildingSizesqm, yearBuilt, floors,
        features: features || [], furnished, hasElectricity, hasWater,
        hasInternet, hasSecurity, titleDeedAvailable, titleDeedNumber,
        isNegotiable, isInstallment, installmentYears, diasporaHighlights,
        status: "DRAFT",
      },
      include: { images: true, seller: { include: { profile: true } } },
    });

    logger.info({ listingId: listing.id, sellerId }, "Listing created");
    res.status(201).json({ success: true, data: listing });
  } catch (error) { return next(error); }
}

export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findFirst({
      where: { OR: [{ id }, { slug: id }], status: { not: "DRAFT" } },
      include: {
        images: { orderBy: { order: "asc" } },
        videos: true,
        seller: { include: { profile: true, kyc: { select: { status: true } } } },
        _count: { select: { offers: true, savedBy: true } },
      },
    });
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");

    prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    res.json({ success: true, data: listing });
  } catch (error) { return next(error); }
}

export async function updateListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (existing.sellerId !== userId && userRole !== "ADMIN") throw new AppError("Access denied", 403, "FORBIDDEN");

    const updateData: any = { ...req.body, updatedAt: new Date() };
    if (req.body.price && Number(req.body.price) !== Number(existing.price)) {
      await prisma.priceHistory.create({ data: { listingId: id, price: existing.price, currency: existing.currency, reason: "Price updated" } });
      const rates = await getExchangeRates();
      updateData.priceUsd = convertCurrency(Number(req.body.price), req.body.currency || existing.currency, "USD", rates);
    }

    const listing = await prisma.listing.update({ where: { id }, data: updateData, include: { images: true } });
    res.json({ success: true, data: listing });
  } catch (error) { return next(error); }
}

export async function submitForReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const listing = await prisma.listing.findUnique({ where: { id }, include: { images: true } });
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");
    if (listing.images.length === 0) throw new AppError("At least one image is required", 400, "IMAGES_REQUIRED");

    const updated = await prisma.listing.update({ where: { id }, data: { status: "PENDING_REVIEW" } });
    res.json({ success: true, data: updated });
  } catch (error) { return next(error); }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId && userRole !== "ADMIN") throw new AppError("Access denied", 403, "FORBIDDEN");

    await prisma.listing.update({ where: { id }, data: { status: "WITHDRAWN" } });
    res.json({ success: true, message: "Listing withdrawn" });
  } catch (error) { return next(error); }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { sellerId: userId };
    if (status) where.status = status;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, skip, take: Number(limit),
        include: { images: { where: { isPrimary: true } }, _count: { select: { offers: true, savedBy: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);
    res.json({ success: true, data: { listings, total, page: Number(page), limit: Number(limit) } });
  } catch (error) { return next(error); }
}
