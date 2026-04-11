import Stripe from "stripe";
import * as configModule from "@kunda/config";

const { env, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  return stripeClient;
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  escrowId: string,
  buyerEmail: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe();
  const amountMinor = Math.round(amount * 100);
  const normalizedCurrency = currency.toLowerCase();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: normalizedCurrency,
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: buyerEmail,
    metadata: {
      escrowId,
      buyerEmail,
      platform: "kunda-properties",
    },
    description: `Kunda Properties escrow - ${escrowId}`,
  });

  if (!paymentIntent.client_secret) {
    throw new Error("PAYMENT_INTENT_MISSING_SECRET");
  }

  logger.info("Stripe payment intent created", {
    escrowId,
    paymentIntentId: paymentIntent.id,
    amount,
    currency: normalizedCurrency,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function refundPayment(
  paymentIntentId: string,
  reason: string,
): Promise<void> {
  const stripe = getStripe();

  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: "requested_by_customer",
    metadata: { reason },
  });

  logger.info("Stripe refund created", { paymentIntentId });
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  const stripe = getStripe();

  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
