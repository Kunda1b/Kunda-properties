import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.middleware";
import { payoutService } from "../services/payout.service";

const initiatePayoutSchema = z.object({
  provider: z.enum(["WAVE", "ORANGE_MONEY"]),
  recipientPhone: z.string().min(7, "Enter a valid phone number"),
  recipientName: z.string().min(2, "Enter the recipient name"),
});

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  ESCROW_NOT_FOUND: { status: 404, message: "Escrow not found" },
  ESCROW_NOT_COMPLETED: {
    status: 400,
    message: "Escrow must be completed before payout",
  },
  WAVE_PAYOUT_FAILED: {
    status: 502,
    message: "Wave payout failed - please try again",
  },
  PAYOUT_NOT_FOUND: {
    status: 404,
    message: "Payout queue item not found",
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

  console.error("Payout error:", error);
  res.status(500).json({
    success: false,
    error: "Something went wrong",
    code: "INTERNAL_ERROR",
  });
}

export const payoutController = {
  async initiate(req: AuthRequest, res: Response): Promise<void> {
    const result = initiatePayoutSchema.safeParse(req.body);

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
      const data = await payoutService.initiatePayout({
        escrowId: req.params.escrowId,
        adminId: req.user!.userId,
        ...result.data,
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getPendingOrangeMoney(
    _req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const data = await payoutService.getPendingOrangeMoneyPayouts();
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async markOrangeMoneyComplete(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      await payoutService.markOrangeMoneyComplete(
        req.params.payoutId,
        req.user!.userId,
        req.body.note,
      );

      res.status(200).json({
        success: true,
        data: { message: "Payout marked as complete" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getBalance(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await payoutService.getWalletBalance();
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await payoutService.getPayoutHistory(req.params.escrowId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },
};
