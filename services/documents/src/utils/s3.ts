import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, logger } from "@kunda/config";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const isMinIO = !!env.AWS_ENDPOINT;

  s3Client = new S3Client({
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

  if (isMinIO) {
    logger.info("S3 client configured for MinIO (local dev)", {
      endpoint: env.AWS_ENDPOINT,
    });
  } else {
    logger.info("S3 client configured for AWS S3");
  }

  return s3Client;
}

export async function ensureBucketExists(): Promise<void> {
  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    logger.info("S3 bucket exists", { bucket });
  } catch {
    logger.info("Creating S3 bucket", { bucket });
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    logger.info("S3 bucket created", { bucket });
  }
}

export async function uploadDocument(
  key: string,
  buffer: Buffer,
  contentType = "application/pdf",
): Promise<string> {
  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
      Metadata: {
        platform: "kunda-properties",
        uploadedAt: new Date().toISOString(),
      },
    }),
  );

  const isMinIO = !!env.AWS_ENDPOINT;
  const s3Url = isMinIO
    ? `${env.AWS_ENDPOINT}/${bucket}/${key}`
    : `https://${bucket}.s3.${env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

  logger.info("Document uploaded", { key, bucket });
  return s3Url;
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const signUrl = getSignedUrl as unknown as (
    signerClient: unknown,
    signerCommand: unknown,
    options: { expiresIn: number },
  ) => Promise<string>;

  const url = await signUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  logger.info("Signed download URL generated", { key, expiresInSeconds });
  return url;
}

export async function deleteDocument(key: string): Promise<void> {
  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  logger.info("Document deleted from S3", { key });
}

export function buildS3Key(
  type: string,
  escrowId: string,
  filename: string,
): string {
  const date = new Date().toISOString().split("T")[0];
  return `documents/${type}/${date}/${escrowId}/${filename}`;
}

export async function getDocumentBuffer(key: string): Promise<Buffer> {
  const bucket = env.AWS_BUCKET_NAME || "kunda-documents-dev";
  const client = getS3Client();

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  const chunks: Uint8Array[] = [];
  const stream = response.Body as unknown as AsyncIterable<Uint8Array>;

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
