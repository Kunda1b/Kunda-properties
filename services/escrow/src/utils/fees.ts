import type { FeeBreakdown } from "@kunda/types";
import * as configModule from "@kunda/config";

const { ESCROW_PLATFORM_FEE_PERCENT } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export function calculateFees(amount: number, currency = "GBP"): FeeBreakdown {
  const feePercent = ESCROW_PLATFORM_FEE_PERCENT;
  const platformFee = Number(((amount * feePercent) / 100).toFixed(2));
  const total = Number((amount + platformFee).toFixed(2));

  return {
    subtotal: amount,
    platformFee,
    total,
    currency,
    feePercent,
  };
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}
