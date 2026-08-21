import express, { Router } from "express";
import { db } from "@workspace/db";
import { escrowAccounts, transactions } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { getStripe } from "../lib/stripe.js";

const router = Router();

// Raw body parser for Stripe signature verification
router.use(express.raw({ type: "application/json" }));

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(503).json({ error: "Webhook is not configured" });
  }

  let event: any;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error({ error: err.message }, "Stripe webhook signature verification failed");
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "payment_intent.amount_capturable_updated":
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const escrowId = pi.metadata?.escrowId;
        if (!escrowId) {
          logger.warn({ paymentIntent: pi.id }, "Webhook: no escrowId in metadata");
          break;
        }

        const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, escrowId)).limit(1);
        if (!escrow) {
          logger.warn({ escrowId, paymentIntent: pi.id }, "Webhook: escrow not found");
          break;
        }

        // Metadata alone is not sufficient: reject events for another intent.
        if (escrow.stripePaymentIntentId !== pi.id) {
          logger.warn({ escrowId, paymentIntent: pi.id }, "Webhook PaymentIntent does not match escrow");
          break;
        }
        if (!["INITIATED", "FUNDED", "INSPECTING", "APPROVED"].includes(escrow.status)) break;

        if (event.type === "payment_intent.amount_capturable_updated") {
          await db.update(escrowAccounts)
            .set({ status: "FUNDED", updatedAt: new Date() })
            .where(and(eq(escrowAccounts.id, escrowId), eq(escrowAccounts.status, "INITIATED")));
          logger.info({ escrowId, paymentIntent: pi.id }, "Escrow payment authorized");
          break;
        }

        // Stripe retries webhooks. The unique charge/intent key makes processing idempotent.
        await db.insert(transactions).values({
          escrowId,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: escrow.totalAmount,
          currency: escrow.currency,
          stripeChargeId: pi.latest_charge || pi.id,
          processedAt: new Date(),
        }).onConflictDoNothing();

        if (escrow.status === "INITIATED") {
          await db.update(escrowAccounts)
            .set({ status: "FUNDED", updatedAt: new Date() })
            .where(and(eq(escrowAccounts.id, escrowId), eq(escrowAccounts.status, "INITIATED")));
        }
        logger.info({ escrowId, paymentIntent: pi.id, event: event.type }, "Escrow payment state processed");
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const escrowId = pi.metadata?.escrowId;
        if (escrowId) {
          await db.update(escrowAccounts)
            .set({ status: "CANCELLED", notes: "Payment failed", updatedAt: new Date() })
            .where(and(eq(escrowAccounts.id, escrowId), eq(escrowAccounts.status, "INITIATED")));
          logger.warn({ escrowId, paymentIntent: pi.id }, "Escrow payment failed");
        }
        break;
      }

      case "transfer.created":
      case "transfer.paid": {
        // Track seller payouts if needed
        logger.info({ transfer: event.data.object.id }, "Stripe transfer event received");
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error({ error: err.message, type: event.type }, "Webhook handler error");
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

export { router as stripeWebhook };
