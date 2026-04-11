"use client";

import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

type Props = {
  escrowId: string;
  amount: number;
  currency: string;
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function CheckoutForm({ escrowId, amount, currency }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/${escrowId}/success`,
      },
    });

    if (result.error) {
      setError(result.error.message || "Payment failed - please try again.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "apple_pay", "google_pay"],
        }}
      />

      {error ? (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="mt-5 w-full rounded-xl bg-kunda-forest py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing payment...
          </span>
        ) : (
          `Pay ${formatPrice(amount, currency)} securely`
        )}
      </button>

      <div className="mt-4 flex items-center justify-center gap-3">
        {["Visa", "Mastercard", "Amex"].map((card) => (
          <span
            key={card}
            className="rounded-md border border-gray-100 px-2 py-1 text-xs text-gray-400"
          >
            {card}
          </span>
        ))}
        <span className="text-xs text-gray-400">· Secured by Stripe</span>
      </div>
    </form>
  );
}
