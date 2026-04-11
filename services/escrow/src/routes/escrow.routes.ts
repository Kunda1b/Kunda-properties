import { Router } from "express";
import { escrowController } from "../controllers/escrow.controller";
import { payoutController } from "../controllers/payout.controller";
import {
  requireAuth,
  requireKYC,
  requireRole,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/webhook/stripe", escrowController.stripeWebhook);

router.use(requireAuth);

router.post("/", requireKYC, escrowController.initiate);
router.get("/my", escrowController.myEscrows);
router.get("/all", requireRole("ADMIN"), escrowController.all);
router.get("/balance", requireRole("ADMIN"), payoutController.getBalance);
router.get(
  "/payouts/orange-money/pending",
  requireRole("ADMIN"),
  payoutController.getPendingOrangeMoney,
);
router.post(
  "/payouts/orange-money/:payoutId/complete",
  requireRole("ADMIN"),
  payoutController.markOrangeMoneyComplete,
);
router.get("/:id", escrowController.findById);
router.post("/:id/payment", requireKYC, escrowController.createPayment);
router.post("/:id/dispute", escrowController.dispute);
router.post("/:id/verify-title", requireRole("ADMIN"), escrowController.verifyTitle);
router.post("/:id/sign-docs", requireRole("ADMIN"), escrowController.signDocs);
router.post("/:id/complete", requireRole("ADMIN"), escrowController.complete);
router.post("/:id/refund", requireRole("ADMIN"), escrowController.refund);
router.post("/:escrowId/payout", requireRole("ADMIN"), payoutController.initiate);
router.get("/:escrowId/payouts", requireRole("ADMIN"), payoutController.getHistory);

export { router as escrowRoutes };
