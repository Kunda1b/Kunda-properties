import axios from "axios";
import * as configModule from "@kunda/config";

const { env, logger } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const WAVE_API_BASE = `${env.WAVE_BASE_URL}/v1`;

type WavePayoutInput = {
  recipientPhone: string;
  amountGMD: number;
  reference: string;
  description: string;
};

type WavePayoutResult = {
  id: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  recipientPhone: string;
  amountGMD: number;
  reference: string;
  createdAt: string;
};

type WaveBalanceResult = {
  currency: string;
  amount: number;
};

function getWaveClient() {
  if (!env.WAVE_API_KEY) {
    throw new Error("WAVE_API_KEY not configured");
  }

  return axios.create({
    baseURL: WAVE_API_BASE,
    headers: {
      Authorization: `Bearer ${env.WAVE_API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
}

export async function sendWavePayout(
  input: WavePayoutInput,
): Promise<WavePayoutResult> {
  if (env.NODE_ENV === "development") {
    logger.info("Wave payout (mock)", {
      recipientPhone: input.recipientPhone,
      amountGMD: input.amountGMD,
      reference: input.reference,
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const isTestFail = input.recipientPhone === "+220000000";

    return {
      id: `wave-mock-${Date.now()}`,
      status: isTestFail ? "FAILED" : "SUCCEEDED",
      recipientPhone: input.recipientPhone,
      amountGMD: input.amountGMD,
      reference: input.reference,
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const client = getWaveClient();

    const response = await client.post("/payout", {
      receive_amount: input.amountGMD,
      currency: "GMD",
      mobile: input.recipientPhone,
      name: "Kunda Properties Payout",
      client_reference: input.reference,
      payment_reason: input.description,
    });

    logger.info("Wave payout sent", {
      payoutId: response.data.id,
      reference: input.reference,
      amountGMD: input.amountGMD,
    });

    return {
      id: response.data.id,
      status: response.data.status === "succeeded" ? "SUCCEEDED" : "PENDING",
      recipientPhone: input.recipientPhone,
      amountGMD: input.amountGMD,
      reference: input.reference,
      createdAt: response.data.created_at,
    };
  } catch (error) {
    logger.error("Wave payout failed", {
      reference: input.reference,
      error: axios.isAxiosError(error) ? error.response?.data || error.message : error,
    });
    throw new Error("WAVE_PAYOUT_FAILED");
  }
}

export async function getWavePayoutStatus(
  payoutId: string,
): Promise<WavePayoutResult> {
  if (env.NODE_ENV === "development") {
    return {
      id: payoutId,
      status: "SUCCEEDED",
      recipientPhone: "+220000000",
      amountGMD: 0,
      reference: "mock",
      createdAt: new Date().toISOString(),
    };
  }

  const client = getWaveClient();
  const response = await client.get(`/payout/${payoutId}`);

  return {
    id: response.data.id,
    status: response.data.status === "succeeded" ? "SUCCEEDED" : "PENDING",
    recipientPhone: response.data.mobile,
    amountGMD: response.data.receive_amount,
    reference: response.data.client_reference,
    createdAt: response.data.created_at,
  };
}

export async function getWaveBalance(): Promise<WaveBalanceResult> {
  if (env.NODE_ENV === "development") {
    return { currency: "GMD", amount: 500000 };
  }

  const client = getWaveClient();
  const response = await client.get("/balance");

  return {
    currency: "GMD",
    amount: response.data.amount,
  };
}
