import jwt, { SignOptions } from "jsonwebtoken";
import { AppError } from "./errors.js";

const DEV_FALLBACK = "dev-kunda-secret-change-me";
const rawSecret = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "production" && (!rawSecret || rawSecret === DEV_FALLBACK || rawSecret.length < 32)) {
  throw new Error(
    "SESSION_SECRET must be set to a strong random value (≥32 chars) in production.",
  );
}

const JWT_SECRET = rawSecret ?? DEV_FALLBACK;
const JWT_REFRESH_SECRET = JWT_SECRET + "_refresh";

export interface TokenPayload {
  sub: string;
  role: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { sub: userId, role, type: "access" },
    JWT_SECRET,
    { expiresIn: "15m" } as SignOptions,
  );
  const refreshToken = jwt.sign(
    { sub: userId, role, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" } as SignOptions,
  );
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw new AppError("Access token expired", 401, "TOKEN_EXPIRED");
    throw new AppError("Invalid access token", 401, "TOKEN_INVALID");
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw new AppError("Refresh token expired", 401, "TOKEN_EXPIRED");
    throw new AppError("Invalid refresh token", 401, "TOKEN_INVALID");
  }
}
