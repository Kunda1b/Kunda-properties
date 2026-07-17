import { db } from "@workspace/db";
import { exchangeRates } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger.js";

const CURRENCY_PAIRS = [
  ["GMD", "USD"], ["GMD", "GBP"], ["GMD", "EUR"],
  ["USD", "GMD"], ["USD", "GBP"], ["USD", "EUR"],
  ["GBP", "GMD"], ["GBP", "USD"], ["GBP", "EUR"],
  ["EUR", "GMD"], ["EUR", "USD"], ["EUR", "GBP"],
];

const API_BASE = "https://api.frankfurter.dev/latest";

export async function refreshExchangeRates(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}?base=USD&symbols=GMD,GBP,EUR`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      logger.warn({ status: response.status }, "Exchange rate API request failed");
      return;
    }
    const data = await response.json();
    const usdRates: Record<string, number> = data.rates;

    const baseGmd = usdRates.GMD;

    for (const [fromCcy, toCcy] of CURRENCY_PAIRS) {
      let rate: number;
      if (fromCcy === "USD") {
        rate = usdRates[toCcy] || 1;
      } else if (toCcy === "USD") {
        rate = 1 / (usdRates[fromCcy] || 1);
      } else if (fromCcy === "GMD") {
        rate = usdRates[toCcy] / baseGmd;
      } else if (toCcy === "GMD") {
        rate = baseGmd / usdRates[fromCcy];
      } else {
        rate = usdRates[toCcy] / usdRates[fromCcy];
      }

      if (!isFinite(rate) || rate <= 0) continue;

      const [existing] = await db.select({ id: exchangeRates.id }).from(exchangeRates)
        .where(and(
          eq(exchangeRates.fromCurrency, fromCcy),
          eq(exchangeRates.toCurrency, toCcy),
        )).limit(1);

      if (existing) {
        await db.update(exchangeRates)
          .set({ rate: String(rate), source: "frankfurter", updatedAt: new Date() })
          .where(eq(exchangeRates.id, existing.id));
      } else {
        await db.insert(exchangeRates)
          .values({ fromCurrency: fromCcy, toCurrency: toCcy, rate: String(rate), source: "frankfurter" });
      }
    }

    logger.info("Exchange rates refreshed from Frankfurter API");
  } catch (err: any) {
    logger.warn({ error: err.message }, "Failed to refresh exchange rates");
  }
}
