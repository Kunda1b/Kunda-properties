import { Request, Response, NextFunction } from "express";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function makeOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const buyerId = (req as any).user.id;
    const { listingId, amount, currency, message, expiresInDays = 7 } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") throw new AppError("Listing not available", 400, "UNAVAILABLE");
    if (listing.sellerId === buyerId) throw new AppError("Cannot make offer on your own listing", 400, "OWN_LISTING");

    const expiresAt = new Date(Date.now() + Number(expiresInDays) * 86400 * 1000);
    const offer = await prisma.offer.create({
      data: { listingId, buyerId, amount, currency, message, expiresAt, status: "PENDING" },
      include: { listing: { select: { title: true, sellerId: true } }, buyer: { include: { profile: true } } },
    });

    logger.info({ offerId: offer.id, buyerId, listingId }, "Offer made");
    res.status(201).json({ success: true, data: offer });
  } catch (error) { next(error); }
}

export async function respondToOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const { offerId } = req.params;
    const userId = (req as any).user.id;
    const { action, counterAmount, counterMessage } = req.body;

    const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { listing: true } });
    if (!offer) throw new AppError("Offer not found", 404, "NOT_FOUND");
    if (offer.listing.sellerId !== userId) throw new AppError("Only the seller can respond", 403, "FORBIDDEN");
    if (offer.status !== "PENDING") throw new AppError("Offer is no longer pending", 400, "INVALID_STATE");
    if (offer.expiresAt < new Date()) throw new AppError("Offer has expired", 400, "OFFER_EXPIRED");

    let updateData: any = {};
    if (action === "accept") {
      updateData = { status: "ACCEPTED", acceptedAt: new Date() };
      await prisma.listing.update({ where: { id: offer.listingId }, data: { status: "UNDER_OFFER" } });
    } else if (action === "reject") {
      updateData = { status: "REJECTED", rejectedAt: new Date() };
    } else if (action === "counter") {
      if (!counterAmount) throw new AppError("Counter amount required", 400, "COUNTER_AMOUNT_REQUIRED");
      updateData = { status: "COUNTERED", counterAmount, counterMessage };
    }

    const updated = await prisma.offer.update({ where: { id: offerId }, data: updateData });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

export async function getMyOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { role = "buyer", status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = role === "buyer" ? { buyerId: userId } : { listing: { sellerId: userId } };
    if (status) where.status = status;

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where, skip, take: Number(limit),
        include: {
          listing: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          buyer: { include: { profile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          escrow: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.offer.count({ where }),
    ]);
    res.json({ success: true, data: { offers, total, page: Number(page), limit: Number(limit) } });
  } catch (error) { next(error); }
}
