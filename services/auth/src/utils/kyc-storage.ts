import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, logger } from "@kunda/config";

function getS3Client(): S3Client {
  return new S3Client({
    region: env.AWS_REGION || "us-east-1",
    endpoint: env.AWS_ENDPOINT,
    forcePathStyle: env.AWS_FORCE_PATH_STYLE === "true",
    credentials:
      env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

export async function uploadKYCDocument(
  userId: string,
  type: "document" | "selfie",
  base64Data: string,
  mimeType = "image/jpeg",
): Promise<string> {
  if (env.NODE_ENV === "development" && !env.AWS_ENDPOINT) {
    logger.info("KYC document upload skipped (no S3 configured)", {
      userId,
      type,
    });
    return `mock-s3-key/kyc/${userId}/${type}-${Date.now()}.jpg`;
  }

  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  const buffer = Buffer.from(base64Data, "base64");
  const extension = mimeType.split("/")[1] || "jpg";
  const key = `kyc/${userId}/${type}-${Date.now()}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
      Metadata: {
        userId,
        documentType: type,
        uploadedAt: new Date().toISOString(),
      },
    }),
  );

  logger.info("KYC document uploaded", { userId, type, key });
  return key;
}

export async function getKYCDocumentUrl(
  s3Key: string,
  expiresInSeconds = 900,
): Promise<string> {
  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
  const signUrl = getSignedUrl as unknown as (
    signerClient: unknown,
    signerCommand: unknown,
    options: { expiresIn: number },
  ) => Promise<string>;

  return signUrl(client, command, { expiresIn: expiresInSeconds });
}
