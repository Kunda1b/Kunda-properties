import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { logger } from "@kunda/config";
import { HttpError, isHttpError } from "./errors";

type CreateAppOptions = {
  name: string;
  multipart?: boolean;
};

export function createServiceApp({ name, multipart: enableMultipart = false }: CreateAppOptions) {
  const app = Fastify({
    bodyLimit: 20 * 1024 * 1024,
    logger: false,
  });

  app.setErrorHandler((error, request, reply) => {
    if (isHttpError(error)) {
      void reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details,
      });
      return;
    }

    logger.error(`${name} request failed`, {
      method: request.method,
      path: request.url,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    void reply.status(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong while processing the request.",
    });
  });

  app.addHook("onRequest", async (request) => {
    logger.info(`${name} request`, {
      method: request.method,
      path: request.url,
    });
  });

  app.get("/health", async () => ({
    service: name,
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  if (enableMultipart) {
    void app.register(multipart, {
      attachFieldsToBody: false,
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
    });
  }

  return app;
}

export function parseJsonBody<T>(request: FastifyRequest, schema: { parse: (value: unknown) => T }): T {
  return schema.parse(request.body ?? {});
}

export function parseQuery<T>(request: FastifyRequest, schema: { parse: (value: unknown) => T }): T {
  return schema.parse(request.query ?? {});
}

export function sendCreated(reply: FastifyReply, payload: unknown) {
  return reply.status(201).send(payload);
}

export async function saveIncomingFile(
  request: FastifyRequest,
  folder: string,
): Promise<{ filename: string; mimetype: string; path: string; size: number }> {
  const file = await request.file();

  if (!file) {
    throw new HttpError(400, "File upload is required", "FILE_REQUIRED");
  }

  const uploadsRoot = process.env.STORAGE_ROOT ?? join(process.cwd(), ".storage");
  const targetFolder = join(uploadsRoot, folder);
  await mkdir(targetFolder, { recursive: true });

  const uniqueName = `${randomUUID()}-${file.filename}`;
  const targetPath = join(targetFolder, uniqueName);
  const stream = createWriteStream(targetPath);

  await pipeline(file.file, stream);

  return {
    filename: file.filename,
    mimetype: file.mimetype,
    path: targetPath,
    size: file.file.bytesRead,
  };
}

export function requireParam(value: string | undefined, label: string): string {
  if (!value) {
    throw new HttpError(400, `${label} is required`, "MISSING_PARAM");
  }

  return value;
}

export async function readRawBody(request: FastifyRequest): Promise<Buffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === "string") {
    return Buffer.from(request.body);
  }

  if (request.body && typeof request.body === "object") {
    return Buffer.from(JSON.stringify(request.body));
  }

  const chunks: Buffer[] = [];

  for await (const chunk of request.raw) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}
