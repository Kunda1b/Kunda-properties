import { Request, Response, NextFunction } from "express";
import { cloudinary } from "../utils/cloudinary";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { type, title, description, listingId, isPublic, fileData, mimeType, fileName } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) throw new AppError("File type not allowed. Use PDF, JPEG, or PNG.", 400, "INVALID_FILE_TYPE");

    const uploadOptions: any = {
      folder: `kunda/documents/${userId}`,
      resource_type: "auto",
      type: isPublic ? "upload" : "private",
      tags: ["document", type],
      context: { userId, listingId: listingId || "", documentType: type },
    };
    if (!isPublic) uploadOptions.access_mode = "authenticated";

    const result = await cloudinary.uploader.upload(fileData, uploadOptions);

    const document = await prisma.document.create({
      data: {
        uploadedById: userId, listingId, type, title, description,
        cloudinaryId: result.public_id,
        url: isPublic ? result.secure_url : undefined,
        encryptedUrl: !isPublic ? result.secure_url : undefined,
        fileSize: result.bytes, mimeType, isPublic: Boolean(isPublic), status: "UPLOADED",
        metadata: { originalName: fileName, format: result.format },
      },
    });

    logger.info({ documentId: document.id, type, userId }, "Document uploaded");
    res.status(201).json({ success: true, data: document });
  } catch (error) { next(error); }
}

export async function getSignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");

    let hasAccess = doc.uploadedById === userId || userRole === "ADMIN" || doc.isPublic;
    if (!hasAccess && doc.listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: doc.listingId } });
      if (listing?.sellerId === userId) hasAccess = true;
    }
    if (!hasAccess) throw new AppError("Access denied", 403, "FORBIDDEN");

    if (doc.isPublic) return res.json({ success: true, data: { url: doc.url, expiresAt: null } });
    if (!doc.cloudinaryId) throw new AppError("Document file not found", 404, "FILE_NOT_FOUND");

    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = cloudinary.utils.private_download_url(doc.cloudinaryId, "pdf", { expires_at: expiresAt, attachment: false });
    return res.json({ success: true, data: { url: signedUrl, expiresAt: new Date(expiresAt * 1000) } });
  } catch (error) { next(error); }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { listingId, type, status } = req.query;
    const where: any = { uploadedById: userId };
    if (listingId) where.listingId = listingId;
    if (type) where.type = type;
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where, orderBy: { createdAt: "desc" },
      select: { id: true, type: true, title: true, description: true, status: true, isPublic: true,
        fileSize: true, mimeType: true, url: true, verifiedAt: true, expiryDate: true, createdAt: true },
    });
    res.json({ success: true, data: documents });
  } catch (error) { next(error); }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { documentId } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");
    if (doc.uploadedById !== userId && userRole !== "ADMIN") throw new AppError("Access denied", 403, "FORBIDDEN");
    if (doc.status === "VERIFIED") throw new AppError("Cannot delete a verified document", 400, "CANNOT_DELETE_VERIFIED");

    if (doc.cloudinaryId) await cloudinary.uploader.destroy(doc.cloudinaryId, { resource_type: "raw" }).catch(() => {});
    await prisma.document.delete({ where: { id: documentId } });
    res.json({ success: true, message: "Document deleted" });
  } catch (error) { next(error); }
}
