import axios from "axios";
import * as configModule from "@kunda/config";

const { logger } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const GMD_PER_GBP_FALLBACK = 85;

type FXRate = {
  from: string;
  to: string;
  rate: number;
  source: string;
  timestamp: string;
};

export async function getGBPtoGMDRate(): Promise<FXRate> {
  if (process.env.NODE_ENV === "development") {
    logger.info("FX rate (mock)", {
      rate: GMD_PER_GBP_FALLBACK,
    });

    return {
      from: "GBP",
      to: "GMD",
      rate: GMD_PER_GBP_FALLBACK,
      source: "mock",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await axios.get("https://api.exchangerate-api.com/v4/latest/GBP", {
      timeout: 5000,
    });

    const rate = response.data.rates.GMD;

    if (!rate) {
      throw new Error("GMD rate not found in response");
    }

    logger.info("FX rate fetched", { rate, source: "exchangerate-api" });

    return {
      from: "GBP",
      to: "GMD",
      rate,
      source: "exchangerate-api",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.warn("FX rate fetch failed, using fallback", {
      fallback: GMD_PER_GBP_FALLBACK,
      error,
    });

    return {
      from: "GBP",
      to: "GMD",
      rate: GMD_PER_GBP_FALLBACK,
      source: "fallback",
      timestamp: new Date().toISOString(),
    };
  }
}

export function convertGBPtoGMD(amountGBP: number, rate: number): number {
  return parseFloat((amountGBP * rate).toFixed(2));
}

export function formatGMD(amount: number): string {
  return new Intl.NumberFormat("en-GM", {
    style: "currency",
    currency: "GMD",
    maximumFractionDigits: 0,
  }).format(amount);
}
