import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@kunda/config";
import { HttpError } from "./errors";

export type StoredObject = {
  key: string;
  provider: "local" | "s3";
  size: number;
  url: string;
};

let client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!env.AWS_BUCKET_NAME || !env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }

  if (client) {
    return client;
  }

  client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

function resolveLocalStorageRoot() {
  return process.env.STORAGE_ROOT ?? join(process.cwd(), ".storage");
}

export async function storeBuffer(
  buffer: Buffer,
  options: {
    contentType: string;
    filename: string;
    folder: string;
  },
): Promise<StoredObject> {
  const key = `${options.folder}/${randomUUID()}-${basename(options.filename)}`;
  const s3 = getS3Client();

  if (s3 && env.AWS_BUCKET_NAME) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
      }),
    );

    return {
      key,
      provider: "s3",
      size: buffer.byteLength,
      url: `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }

  const root = resolveLocalStorageRoot();
  const absolutePath = join(root, key);
  await mkdir(join(root, options.folder), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    key,
    provider: "local",
    size: buffer.byteLength,
    url: `storage://${key}`,
  };
}

export async function storeLocalFile(
  path: string,
  options: {
    contentType: string;
    filename: string;
    folder: string;
  },
): Promise<StoredObject> {
  const buffer = await readFile(path);
  return storeBuffer(buffer, options);
}

export async function readStoredObject(key: string): Promise<{ contentType: string; data: Buffer | NodeJS.ReadableStream }> {
  const s3 = getS3Client();

  if (s3 && env.AWS_BUCKET_NAME) {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new HttpError(404, "Stored object not found", "OBJECT_NOT_FOUND");
    }

    return {
      contentType: response.ContentType ?? "application/octet-stream",
      data: response.Body as NodeJS.ReadableStream,
    };
  }

  const localPath = join(resolveLocalStorageRoot(), key);
  return {
    contentType: inferContentType(key),
    data: createReadStream(localPath),
  };
}

function inferContentType(key: string): string {
  if (key.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (key.endsWith(".png")) {
    return "image/png";
  }

  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}
