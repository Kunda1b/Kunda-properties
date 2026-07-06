import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "@kunda/database";
import { logger } from "../utils/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { apiVersion: "2024-04-10" });

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const escrowId = pi.metadata.escrowId;
        if (!escrowId) break;
        await prisma.$transaction([
          prisma.escrowAccount.update({ where: { id: escrowId }, data: { status: "FUNDED", fundedAt: new Date() } }),
          prisma.transaction.updateMany({ where: { stripePaymentIntentId: pi.id }, data: { status: "COMPLETED", stripeChargeId: pi.latest_charge as string, processedAt: new Date() } }),
        ]);
        logger.info({ escrowId }, "Escrow funded via Stripe");
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (!pi.metadata.escrowId) break;
        await prisma.transaction.updateMany({ where: { stripePaymentIntentId: pi.id }, data: { status: "FAILED", failureReason: pi.last_payment_error?.message || "Payment failed" } });
        break;
      }
      default:
        logger.debug({ type: event.type }, "Unhandled webhook event");
    }
    res.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Error processing webhook");
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
