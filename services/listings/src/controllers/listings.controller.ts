import type { Request, Response } from "express";
import {
  createListingSchema,
  listingSearchSchema,
  updateListingSchema,
} from "@kunda/validators";
import type { AuthRequest } from "../middleware/auth.middleware";
import { listingsService } from "../services/listings.service";

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  LISTING_NOT_FOUND: {
    status: 404,
    message: "Listing not found",
  },
  FORBIDDEN: {
    status: 403,
    message: "You do not have permission to modify this listing",
  },
  PHOTO_LIMIT_REACHED: {
    status: 400,
    message: "Maximum of 10 photos per listing",
  },
  PHOTO_NOT_FOUND: {
    status: 404,
    message: "Photo not found",
  },
  UPLOAD_FAILED: {
    status: 500,
    message: "Photo upload failed — please try again",
  },
  VALIDATION_ERROR: {
    status: 400,
    message: "Invalid input",
  },
};

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const mapped = ERROR_MAP[message];

  if (mapped) {
    res.status(mapped.status).json({
      success: false,
      error: mapped.message,
      code: message,
    });
    return;
  }

  console.error("Unhandled listings error:", error);
  res.status(500).json({
    success: false,
    error: "Something went wrong",
    code: "INTERNAL_ERROR",
  });
}

export const listingsController = {
  async search(req: Request, res: Response): Promise<void> {
    const result = listingSearchSchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid search parameters",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const data = await listingsService.search(result.data);
      res.status(200).json({
        success: true,
        ...data,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const listing = await listingsService.findById(req.params.id);

      if (!listing) {
        res.status(404).json({
          success: false,
          error: "Listing not found",
          code: "LISTING_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getMyListings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const listings = await listingsService.getAgentListings(req.user!.userId);
      res.status(200).json({
        success: true,
        data: listings,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getSavedListings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const listings = await listingsService.getSavedListings(req.user!.userId);
      res.status(200).json({
        success: true,
        data: listings,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    const result = createListingSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid listing data",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const listing = await listingsService.create(result.data, req.user!.userId);
      res.status(201).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    const result = updateListingSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid listing data",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const listing = await listingsService.update(
        req.params.id,
        result.data,
        req.user!.userId,
      );

      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async publish(req: AuthRequest, res: Response): Promise<void> {
    try {
      const listing = await listingsService.publish(req.params.id, req.user!.userId);
      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async reject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const listing = await listingsService.reject(
        req.params.id,
        req.user!.userId,
        req.body.reason || "",
      );

      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await listingsService.delete(req.params.id, req.user!.userId);
      res.status(200).json({
        success: true,
        data: { message: "Listing deleted" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async addPhoto(req: AuthRequest, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded",
        code: "NO_FILE",
      });
      return;
    }

    try {
      const result = await listingsService.addPhoto(
        req.params.id,
        req.user!.userId,
        req.file.path,
        req.file.originalname,
        req.body.isPrimary === "true",
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async registerPhoto(req: AuthRequest, res: Response): Promise<void> {
    const { publicId, url, isPrimary } = req.body as {
      publicId?: string;
      url?: string;
      isPrimary?: boolean;
    };

    if (!publicId && !url) {
      res.status(400).json({
        success: false,
        error: "publicId or url is required",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const result = await listingsService.registerPhoto(
        req.params.id,
        req.user!.userId,
        publicId || "",
        url || "",
        isPrimary ?? false,
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async deletePhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      await listingsService.deletePhoto(req.params.photoId, req.user!.userId);
      res.status(200).json({
        success: true,
        data: { message: "Photo deleted" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async saveListing(req: AuthRequest, res: Response): Promise<void> {
    try {
      await listingsService.saveListing(req.params.id, req.user!.userId);
      res.status(200).json({
        success: true,
        data: { message: "Listing saved" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async unsaveListing(req: AuthRequest, res: Response): Promise<void> {
    try {
      await listingsService.unsaveListing(req.params.id, req.user!.userId);
      res.status(200).json({
        success: true,
        data: { message: "Listing removed from saved items" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getUploadSignature(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { generateSignedUploadParams } = await import("../utils/cloudinary");
      const params = await generateSignedUploadParams(req.params.id);
      res.status(200).json({ success: true, data: params });
    } catch (error) {
      handleError(res, error);
    }
  },

  async reorderPhotos(req: AuthRequest, res: Response): Promise<void> {
    const { orderedIds } = req.body as { orderedIds?: string[] };
    if (!orderedIds || !Array.isArray(orderedIds)) {
      res.status(400).json({
        success: false,
        error: "orderedIds must be an array of photo IDs",
        code: "VALIDATION_ERROR",
      });
      return;
    }
    try {
      await listingsService.reorderPhotos(
        req.params.id,
        req.user!.userId,
        orderedIds,
      );
      res.status(200).json({ success: true, data: { message: "Photos reordered" } });
    } catch (error) {
      handleError(res, error);
    }
  },

  async setPrimaryPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      await listingsService.setPrimaryPhoto(
        req.params.id,
        req.user!.userId,
        req.params.photoId,
      );
      res.status(200).json({ success: true, data: { message: "Primary photo set" } });
    } catch (error) {
      handleError(res, error);
    }
  },
};
