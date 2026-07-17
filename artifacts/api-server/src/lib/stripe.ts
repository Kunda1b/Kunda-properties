import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. " +
      "Set it in your environment variables to enable real payment processing. " +
      "For development, you can use a Stripe test key (sk_test_...)."
    );
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-10",
    typescript: true,
  });
}

export function getWebhookSecret(): string {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return STRIPE_WEBHOOK_SECRET;
}
