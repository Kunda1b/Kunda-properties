"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Props = {
  listingId: string;
  listingTitle: string;
  price: number;
  currency: string;
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function EscrowInitiateButton({
  listingId,
  listingTitle,
  price,
  currency,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const platformFee = parseFloat(((price * 1.5) / 100).toFixed(2));
  const total = price + platformFee;

  async function handleInitiate() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<{
        data: { escrow: { id: string } };
      }>("/api/escrow", {
        method: "POST",
        body: { listingId },
      });

      const escrowId = response.data.escrow.id;
      router.push(`/checkout/${escrowId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate";

      if (message.includes("KYC")) {
        setError("Please verify your identity before purchasing.");
      } else if (message.includes("Authentication")) {
        router.push("/auth/signin");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-xl bg-kunda-forest-soft p-4">
        <h3 className="mb-3 text-sm font-semibold text-kunda-ink">
          Purchase breakdown
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-kunda-muted">Property price</span>
            <span className="font-medium">{formatPrice(price, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kunda-muted">Platform fee (1.5%)</span>
            <span className="font-medium">
              {formatPrice(platformFee, currency)}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-green-200 pt-2">
            <span className="font-semibold text-kunda-ink">Total</span>
            <span className="text-lg font-bold text-kunda-forest">
              {formatPrice(total, currency)}
            </span>
          </div>
        </div>
      </div>

      {error ? <p className="mb-3 text-center text-xs text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={handleInitiate}
        disabled={loading}
        className="w-full rounded-xl bg-kunda-forest py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Setting up escrow..." : "Proceed to secure payment"}
      </button>

      <p className="mt-3 text-center text-xs text-kunda-muted">
        Funds held securely until title is verified and documents are signed.
      </p>
    </div>
  );
}
