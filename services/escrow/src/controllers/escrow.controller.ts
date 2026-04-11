import type { Request, Response } from "express";
import {
  createPaymentSchema,
  disputeEscrowSchema,
  initiateEscrowSchema,
} from "@kunda/validators";
import type { AuthRequest } from "../middleware/auth.middleware";
import { escrowService } from "../services/escrow.service";

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  LISTING_NOT_FOUND: { status: 404, message: "Listing not found" },
  LISTING_NOT_AVAILABLE: {
    status: 400,
    message: "This listing is not available for purchase",
  },
  ESCROW_ALREADY_EXISTS: {
    status: 409,
    message: "You already have an active escrow for this listing",
  },
  ESCROW_NOT_FOUND: {
    status: 404,
    message: "Escrow transaction not found",
  },
  FORBIDDEN: {
    status: 403,
    message: "You do not have permission to access this escrow",
  },
  INVALID_STATE: {
    status: 400,
    message: "This action cannot be performed at the current stage",
  },
  INVALID_TRANSITION: {
    status: 400,
    message: "This state transition is not allowed",
  },
  PAYMENT_METHOD_NOT_SUPPORTED: {
    status: 400,
    message: "This payment method is not supported for the selected currency",
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

  console.error("Unhandled escrow error:", error);
  res.status(500).json({
    success: false,
    error: "Something went wrong",
    code: "INTERNAL_ERROR",
  });
}

export const escrowController = {
  async initiate(req: AuthRequest, res: Response): Promise<void> {
    const result = initiateEscrowSchema.safeParse(req.body);

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
      const data = await escrowService.initiate(result.data, req.user!.userId);
      res.status(201).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async createPayment(req: AuthRequest, res: Response): Promise<void> {
    const result = createPaymentSchema.safeParse(req.body);

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
      const data = await escrowService.createPayment(
        req.params.id,
        req.user!.userId,
        req.user!.email,
        result.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const escrow = await escrowService.findById(req.params.id);

      if (!escrow) {
        res.status(404).json({
          success: false,
          error: "Escrow not found",
          code: "ESCROW_NOT_FOUND",
        });
        return;
      }

      if (escrow.buyerId !== req.user!.userId && req.user!.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          code: "FORBIDDEN",
        });
        return;
      }

      res.status(200).json({ success: true, data: escrow });
    } catch (error) {
      handleError(res, error);
    }
  },

  async myEscrows(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await escrowService.findByBuyer(req.user!.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async all(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await escrowService.findAll(
        req.query.status ? { status: req.query.status as never } : undefined,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async verifyTitle(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await escrowService.verifyTitle(
        req.params.id,
        req.user!.userId,
        req.body.note,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async signDocs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await escrowService.signDocs(
        req.params.id,
        req.user!.userId,
        req.body.note,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async complete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await escrowService.complete(
        req.params.id,
        req.user!.userId,
        req.body.note,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async dispute(req: AuthRequest, res: Response): Promise<void> {
    const result = disputeEscrowSchema.safeParse(req.body);

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
      const data = await escrowService.dispute(
        req.params.id,
        req.user!.userId,
        result.data,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async refund(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = await escrowService.refund(
        req.params.id,
        req.user!.userId,
        req.body.note,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async stripeWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers["stripe-signature"];

    if (typeof signature !== "string" || signature.length === 0) {
      res.status(400).json({
        error: "Missing Stripe signature",
      });
      return;
    }

    try {
      const { constructWebhookEvent } = await import("../utils/stripe");
      const event = constructWebhookEvent(req.body as Buffer, signature);

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as {
          id: string;
          currency?: string;
          metadata?: { escrowId?: string };
        };
        const escrowId = paymentIntent.metadata?.escrowId;

        if (escrowId) {
          await escrowService.fund(
            escrowId,
            paymentIntent.id,
            paymentIntent.currency?.toUpperCase() || "GBP",
          );
        }
      }

      if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object as {
          id: string;
          last_payment_error?: { message?: string };
          metadata?: { escrowId?: string };
        };
        const escrowId = paymentIntent.metadata?.escrowId;

        if (escrowId) {
          await escrowService.markPaymentFailed(
            escrowId,
            paymentIntent.id,
            paymentIntent.last_payment_error?.message,
          );
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({
        error: "Webhook signature verification failed",
      });
    }
  },
};
