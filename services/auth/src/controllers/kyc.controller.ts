import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.middleware";
import { kycService } from "../services/kyc.service";
import { SUPPORTED_ID_TYPES } from "../utils/smile";

const submitKYCSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  country: z.string().length(2, "Use 2-letter country code e.g. GM, GB"),
  idType: z.string().min(1, "ID type is required"),
  idNumber: z.string().min(1, "ID number is required"),
  documentImageBase64: z.string().optional(),
  selfieImageBase64: z.string().optional(),
});

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  USER_NOT_FOUND: { status: 404, message: "User not found" },
  ALREADY_VERIFIED: {
    status: 409,
    message: "Your identity is already verified",
  },
  SMILE_VERIFICATION_FAILED: {
    status: 502,
    message: "Verification service unavailable - please try again",
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

  console.error("KYC error:", error);
  res.status(500).json({
    success: false,
    error: "Something went wrong",
    code: "INTERNAL_ERROR",
  });
}

export const kycController = {
  async submit(req: AuthRequest, res: Response): Promise<void> {
    const result = submitKYCSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const data = await kycService.submit(req.user!.userId, result.data);
      res.status(202).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await kycService.getStatus(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getSupportedIDTypes(_req: AuthRequest, res: Response): Promise<void> {
    const country = _req.query.country as string | undefined;
    const types = country
      ? { [country]: SUPPORTED_ID_TYPES[country] || [] }
      : SUPPORTED_ID_TYPES;

    res.status(200).json({ success: true, data: types });
  },

  async adminApprove(req: AuthRequest, res: Response): Promise<void> {
    try {
      await kycService.adminApprove(req.params.userId, req.user!.userId, req.body.note);
      res.status(200).json({
        success: true,
        data: { message: "KYC approved" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async adminReject(req: AuthRequest, res: Response): Promise<void> {
    const { reason } = req.body as { reason?: string };

    if (!reason) {
      res.status(400).json({
        success: false,
        error: "Rejection reason is required",
        code: "MISSING_REASON",
      });
      return;
    }

    try {
      await kycService.adminReject(req.params.userId, req.user!.userId, reason);
      res.status(200).json({
        success: true,
        data: { message: "KYC rejected" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getPendingQueue(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await kycService.getPendingQueue();
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },
};
