import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@kunda/config";
import { HttpError } from "./errors";

const encoder = new TextEncoder();

export type AccessTokenPayload = {
  email: string;
  role: string;
  sid: string;
  sub: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sid: string;
  sub: string;
  tokenVersion: string;
  type: "refresh";
};

type JwtPayload = (AccessTokenPayload | RefreshTokenPayload) & {
  exp: number;
  iat: number;
};

function base64UrlEncode(value: string | Uint8Array): string {
  const buffer = value instanceof Uint8Array ? Buffer.from(value) : Buffer.from(value);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function parseDuration(value: string, fallbackSeconds: number): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());

  if (!match) {
    return fallbackSeconds;
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "s";

  switch (unit) {
    case "m":
      return amount * 60;
    case "h":
      return amount * 60 * 60;
    case "d":
      return amount * 60 * 60 * 24;
    default:
      return amount;
  }
}

function createSignature(header: string, payload: string): string {
  return base64UrlEncode(
    createHmac("sha256", encoder.encode(env.JWT_SECRET))
      .update(`${header}.${payload}`)
      .digest(),
  );
}

function signToken<T extends AccessTokenPayload | RefreshTokenPayload>(
  payload: T,
  expiresIn: string,
  fallbackSeconds: number,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + parseDuration(expiresIn, fallbackSeconds);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat, exp }));
  const signature = createSignature(header, body);
  return `${header}.${body}.${signature}`;
}

function verifySignature(header: string, payload: string, signature: string) {
  const expected = Buffer.from(createSignature(header, payload));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new HttpError(401, "Invalid token signature", "INVALID_TOKEN");
  }
}

function decodeToken<T extends AccessTokenPayload | RefreshTokenPayload>(
  token: string,
  expectedType: T["type"],
): JwtPayload & T {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new HttpError(401, "Malformed token", "INVALID_TOKEN");
  }

  const [header, payload, signature] = parts as [string, string, string];
  verifySignature(header, payload, signature);

  const decoded = JSON.parse(base64UrlDecode(payload)) as JwtPayload & T;

  if (decoded.type !== expectedType) {
    throw new HttpError(401, "Unexpected token type", "INVALID_TOKEN");
  }

  if (decoded.exp <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "Token has expired", "TOKEN_EXPIRED");
  }

  return decoded;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return signToken(payload, env.JWT_EXPIRES_IN, 60 * 15);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return signToken(payload, env.JWT_REFRESH_EXPIRES_IN, 60 * 60 * 24 * 30);
}

export function verifyAccessToken(token: string): AccessTokenPayload & { exp: number; iat: number } {
  return decodeToken(token, "access");
}

export function verifyRefreshToken(token: string): RefreshTokenPayload & { exp: number; iat: number } {
  return decodeToken(token, "refresh");
}

export function getBearerToken(authorization?: string): string {
  if (!authorization) {
    throw new HttpError(401, "Authorization header is required", "AUTH_REQUIRED");
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Authorization header must use Bearer", "AUTH_REQUIRED");
  }

  return token;
}

export function ttlFromExp(exp: number): number {
  return Math.max(exp - Math.floor(Date.now() / 1000), 1);
}
