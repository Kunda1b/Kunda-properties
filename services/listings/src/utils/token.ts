import jwt from "jsonwebtoken";
import type { SessionPayload } from "@kunda/types";
import * as configModule from "@kunda/config";

const { env } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export function signAccessToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): SessionPayload {
  return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
