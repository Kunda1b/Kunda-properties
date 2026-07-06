import { Request, Response, NextFunction } from "express";
import { cloudinary } from "../utils/cloudinary";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { images } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId && (req as any).user.role !== "ADMIN") throw new AppError("Access denied", 403, "FORBIDDEN");

    const existingCount = await prisma.listingImage.count({ where: { listingId: id } });
    if (existingCount + images.length > 20) throw new AppError("Maximum 20 images per listing", 400, "TOO_MANY_IMAGES");

    const uploaded = await Promise.all(images.map(async (image: { data: string; caption?: string }, index: number) => {
      const result = await cloudinary.uploader.upload(image.data, {
        folder: `kunda/listings/${id}`,
        transformation: [{ width: 1600, height: 1200, crop: "limit", quality: "auto:good" }],
      });
      const thumbnail = cloudinary.url(result.public_id, { width: 400, height: 300, crop: "fill", quality: "auto:eco" });
      return prisma.listingImage.create({
        data: { listingId: id, cloudinaryId: result.public_id, url: result.secure_url, thumbnailUrl: thumbnail,
          caption: image.caption, isPrimary: existingCount === 0 && index === 0, order: existingCount + index },
      });
    }));

    logger.info({ listingId: id, count: uploaded.length }, "Images uploaded");
    res.status(201).json({ success: true, data: uploaded });
  } catch (error) { next(error); }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, imageId } = req.params;
    const userId = (req as any).user.id;
    const [listing, image] = await Promise.all([
      prisma.listing.findUnique({ where: { id } }),
      prisma.listingImage.findUnique({ where: { id: imageId } }),
    ]);
    if (!listing || !image) throw new AppError("Not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId && (req as any).user.role !== "ADMIN") throw new AppError("Access denied", 403, "FORBIDDEN");

    if (image.cloudinaryId) await cloudinary.uploader.destroy(image.cloudinaryId).catch(() => {});
    await prisma.listingImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await prisma.listingImage.findFirst({ where: { listingId: id }, orderBy: { order: "asc" } });
      if (next) await prisma.listingImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
    res.json({ success: true, message: "Image deleted" });
  } catch (error) { next(error); }
}

export async function setPrimaryImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, imageId } = req.params;
    const userId = (req as any).user.id;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
    if (listing.sellerId !== userId) throw new AppError("Access denied", 403, "FORBIDDEN");

    await prisma.$transaction([
      prisma.listingImage.updateMany({ where: { listingId: id }, data: { isPrimary: false } }),
      prisma.listingImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
    res.json({ success: true, message: "Primary image updated" });
  } catch (error) { next(error); }
}

export async function reorderImages(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { order } = req.body;
    await Promise.all(order.map(({ imageId, order: ord }: { imageId: string; order: number }) =>
      prisma.listingImage.update({ where: { id: imageId, listingId: id }, data: { order: ord } })
    ));
    res.json({ success: true, message: "Images reordered" });
  } catch (error) { next(error); }
}
