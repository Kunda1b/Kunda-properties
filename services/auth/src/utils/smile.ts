import { WebApi } from "smile-identity-core";
import { env, logger } from "@kunda/config";

type SmileIDConfig = {
  partnerId: string;
  apiKey: string;
  sidServer: string;
};

type VerificationResult = {
  jobId: string;
  resultCode: string;
  resultText: string;
  actions: {
    liveness_check?: string;
    register_selfie?: string;
    selfie_check?: string;
    return_personal_info?: string;
    verify_id_number?: string;
    [key: string]: string | undefined;
  };
  fullData?: Record<string, unknown>;
};

type IDVerificationInput = {
  userId: string;
  firstName: string;
  lastName: string;
  country: string;
  idType: string;
  idNumber: string;
  selfieImageBase64?: string;
  documentImageBase64?: string;
};

function getConfig(): SmileIDConfig {
  return {
    partnerId: env.SMILE_PARTNER_ID || "demo_partner",
    apiKey: env.SMILE_API_KEY || "demo_key",
    sidServer: env.NODE_ENV === "production" ? "0" : "1",
  };
}

export async function verifyIdentity(
  input: IDVerificationInput,
): Promise<VerificationResult> {
  const config = getConfig();

  if (env.NODE_ENV === "development" || !env.SMILE_PARTNER_ID || !env.SMILE_API_KEY) {
    logger.info("Smile Identity verification (mock)", {
      userId: input.userId,
      idType: input.idType,
      country: input.country,
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    const isTestReject = input.idNumber === "000000000";

    return {
      jobId: `mock-job-${Date.now()}`,
      resultCode: isTestReject ? "1220" : "0810",
      resultText: isTestReject ? "ID Number not found" : "Verified",
      actions: {
        liveness_check: isTestReject ? "Not Applicable" : "Passed",
        register_selfie: isTestReject ? "Not Applicable" : "Passed",
        selfie_check: isTestReject ? "Not Applicable" : "Passed",
        return_personal_info: isTestReject ? "Not Applicable" : "Returned",
        verify_id_number: isTestReject ? "Failed" : "Verified",
      },
    };
  }

  try {
    const client = new WebApi(
      config.partnerId,
      env.SMILE_CALLBACK_URL || `${env.APP_URL}/kyc/callback`,
      config.apiKey,
      config.sidServer,
    );

    const partnerParams = {
      job_id: `kunda-${input.userId}-${Date.now()}`,
      user_id: input.userId,
      job_type: 1,
    };

    const idInfo = {
      first_name: input.firstName,
      last_name: input.lastName,
      country: input.country,
      id_type: input.idType,
      id_number: input.idNumber,
      entered: true,
    };

    const options = {
      return_job_status: true,
      return_history: false,
      return_images: false,
    };

    const result = await client.submit_job(partnerParams, [], idInfo, options);

    logger.info("Smile Identity verification completed", {
      userId: input.userId,
      jobId: partnerParams.job_id,
      resultCode: (result.result as { ResultCode?: string } | undefined)?.ResultCode,
    });

    const smileResult = result.result as
      | {
          ResultCode?: string;
          ResultText?: string;
          Actions?: VerificationResult["actions"];
        }
      | undefined;

    return {
      jobId: String(partnerParams.job_id),
      resultCode: smileResult?.ResultCode || "UNKNOWN",
      resultText: smileResult?.ResultText || "Unknown result",
      actions: smileResult?.Actions || {},
      fullData: result,
    };
  } catch (error) {
    logger.error("Smile Identity verification failed", {
      userId: input.userId,
      error,
    });
    throw new Error("SMILE_VERIFICATION_FAILED");
  }
}

export function isVerified(result: VerificationResult): boolean {
  const VERIFIED_CODES = ["0810", "0811", "0812", "0813", "0820", "0821"];
  return VERIFIED_CODES.includes(result.resultCode);
}

export const SUPPORTED_ID_TYPES: Record<string, string[]> = {
  GM: ["NATIONAL_ID", "PASSPORT", "VOTER_ID"],
  GB: ["PASSPORT", "DRIVING_LICENSE"],
  US: ["PASSPORT", "DRIVERS_LICENSE"],
  SE: ["PASSPORT", "NATIONAL_ID"],
  DE: ["PASSPORT", "NATIONAL_ID"],
  NO: ["PASSPORT", "NATIONAL_ID"],
  SN: ["NATIONAL_ID", "PASSPORT"],
  GH: ["NATIONAL_ID", "PASSPORT", "VOTER_ID"],
};
