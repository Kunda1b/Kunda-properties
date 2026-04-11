"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/escrow/CheckoutForm";
import Navbar from "@/components/layout/Navbar";
import { apiRequest } from "@/lib/api";
import { getStripe } from "@/lib/stripe";

type EscrowApiResponse = {
  data: {
    id: string;
    amountGBP: number;
    platformFee: number;
    status: string;
    listing: {
      title: string;
      location: string;
      price: number;
      currency: string;
    };
  };
};

type PaymentApiResponse = {
  data: {
    clientSecret: string;
    providerPaymentId: string;
    currency: string;
    fees: {
      subtotal: number;
      platformFee: number;
      total: number;
      currency: string;
      feePercent: number;
    };
  };
};

function formatPrice(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CheckoutPage() {
  const params = useParams<{ escrowId: string }>();
  const escrowId = Array.isArray(params.escrowId) ? params.escrowId[0] : params.escrowId;
  const [escrow, setEscrow] = useState<EscrowApiResponse["data"] | null>(null);
  const [payment, setPayment] = useState<PaymentApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCheckout() {
      if (!escrowId) {
        setError("Missing escrow reference.");
        setLoading(false);
        return;
      }

      try {
        const escrowResponse = await apiRequest<EscrowApiResponse>(`/api/escrow/${escrowId}`);
        setEscrow(escrowResponse.data);

        const paymentResponse = await apiRequest<PaymentApiResponse>(
          `/api/escrow/${escrowId}/payment`,
          {
            method: "POST",
            body: {
              provider: "STRIPE",
              currency: escrowResponse.data.listing.currency,
            },
          },
        );

        setPayment(paymentResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load checkout");
      } finally {
        setLoading(false);
      }
    }

    void loadCheckout();
  }, [escrowId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f7]">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />
          <p className="text-sm text-gray-500">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9f9f7]">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="mb-4 text-sm text-red-500">{error}</p>
          <Link href="/listings" className="text-sm font-medium text-kunda-forest">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  if (!escrow || !payment || !escrowId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12l7 7M5 12l7-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to listing
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kunda-forest">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="1"
                      y="4"
                      width="22"
                      height="16"
                      rx="2"
                      ry="2"
                      stroke="white"
                      strokeWidth="1.8"
                    />
                    <line x1="1" y1="10" x2="23" y2="10" stroke="white" strokeWidth="1.8" />
                  </svg>
                </div>
                <h1 className="text-base font-semibold text-gray-900">Secure payment</h1>
              </div>

              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret: payment.clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#0F6E56",
                      borderRadius: "8px",
                      fontFamily: "system-ui, sans-serif",
                    },
                  },
                }}
              >
                <CheckoutForm
                  escrowId={escrowId}
                  amount={payment.fees.total}
                  currency={payment.currency}
                />
              </Elements>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Order summary</h2>

              <div className="mb-4 rounded-xl bg-kunda-forest-soft p-3">
                <p className="mb-0.5 text-xs font-medium text-kunda-forest">
                  {escrow.listing.title}
                </p>
                <p className="text-xs text-gray-500">{escrow.listing.location}</p>
              </div>

              <div className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Property price</span>
                  <span>{formatPrice(payment.fees.subtotal, payment.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Platform fee ({payment.fees.feePercent}%)
                  </span>
                  <span>{formatPrice(payment.fees.platformFee, payment.currency)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-semibold">
                  <span>Total due today</span>
                  <span className="text-kunda-forest">
                    {formatPrice(payment.fees.total, payment.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-500">
                {[
                  "Funds held securely until title verified",
                  "Full refund if deal does not complete",
                  "Signed documents emailed on completion",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mt-0.5 flex-shrink-0"
                    >
                      <path
                        d="M5 12l4 4L19 7"
                        stroke="#0F6E56"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
