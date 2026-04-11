import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpError } from "./errors";
import { readRawBody } from "./http";

export async function proxyRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  options: {
    targetBaseUrl: string;
    stripPrefix: string;
  },
) {
  const incomingUrl = request.url;
  const nextPath = incomingUrl.startsWith(options.stripPrefix)
    ? incomingUrl.slice(options.stripPrefix.length) || "/"
    : incomingUrl;
  const upstreamUrl = new URL(nextPath, options.targetBaseUrl);

  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (!value || key === "host" || key === "content-length") {
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
      continue;
    }

    headers.set(key, value);
  }

  const body = await readRawBody(request);
  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    duplex: body ? "half" : undefined,
  });

  reply.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") {
      return;
    }

    reply.header(key, value);
  });

  const responseBody = Buffer.from(await response.arrayBuffer());
  return reply.send(responseBody);
}

export function ensureServiceTarget(url: string | undefined, label: string): string {
  if (!url) {
    throw new HttpError(500, `${label} is not configured`, "SERVICE_URL_MISSING");
  }

  return url.endsWith("/") ? url : `${url}/`;
}
