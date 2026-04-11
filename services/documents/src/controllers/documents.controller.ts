import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { documentsService } from "../services/documents.service";

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  ESCROW_NOT_FOUND: { status: 404, message: "Escrow transaction not found" },
  DOCUMENT_NOT_FOUND: { status: 404, message: "Document not found" },
  INVALID_ESCROW_STATE: {
    status: 400,
    message: "Document cannot be generated at this escrow stage",
  },
  AGREEMENT_ALREADY_EXISTS: {
    status: 409,
    message: "A sale agreement already exists for this escrow",
  },
  ALREADY_SIGNED: {
    status: 409,
    message: "This document has already been signed",
  },
  FORBIDDEN: {
    status: 403,
    message: "You do not have permission to access this document",
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

  console.error("Unhandled documents error:", error instanceof Error ? {
    message: error.message,
    stack: error.stack,
  } : error);
  res.status(500).json({
    success: false,
    error: "Something went wrong",
    code: "INTERNAL_ERROR",
  });
}

export const documentsController = {
  async generateSaleAgreement(req: AuthRequest, res: Response): Promise<void> {
    try {
      const document = await documentsService.generateSaleAgreement(
        req.params.escrowId,
        req.user!.userId,
      );
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      handleError(res, error);
    }
  },

  async sign(req: AuthRequest, res: Response): Promise<void> {
    try {
      const document = await documentsService.signDocument(
        req.params.id,
        req.user!.userId,
      );
      res.status(200).json({ success: true, data: document });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getDownloadUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
      const url = await documentsService.getDownloadUrl(
        req.params.id,
        req.user!.userId,
      );
      res.status(200).json({
        success: true,
        data: {
          url,
          expiresIn: 3600,
        },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async findByEscrow(req: AuthRequest, res: Response): Promise<void> {
    try {
      const documents = await documentsService.findByEscrow(
        req.params.escrowId,
        req.user!.userId,
      );
      res.status(200).json({ success: true, data: documents });
    } catch (error) {
      handleError(res, error);
    }
  },

  async uploadTitleDeed(req: AuthRequest, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded",
        code: "NO_FILE",
      });
      return;
    }

    try {
      const document = await documentsService.uploadTitleDeed(
        req.params.escrowId,
        req.file.buffer,
        req.file.originalname,
        req.user!.userId,
      );
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      handleError(res, error);
    }
  },
};
