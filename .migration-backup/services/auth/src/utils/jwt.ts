import jwt, { SignOptions } from "jsonwebtoken";
import { AppError } from "./errors";

interface TokenPayload { sub: string; role: string; type: "access"|"refresh"; iat?: number; exp?: number; }

export async function generateTokens(userId: string, role: string) {
  const accessOpts: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as SignOptions["expiresIn"],
  };
  const refreshOpts: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  const accessToken = jwt.sign({ sub: userId, role, type: "access" }, process.env.JWT_SECRET!, accessOpts);
  const refreshToken = jwt.sign({ sub: userId, role, type: "refresh" }, process.env.JWT_REFRESH_SECRET!, refreshOpts);
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  try { return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload; }
  catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new AppError("Access token expired", 401, "TOKEN_EXPIRED");
    throw new AppError("Invalid access token", 401, "TOKEN_INVALID");
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try { return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload; }
  catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new AppError("Refresh token expired", 401, "TOKEN_EXPIRED");
    throw new AppError("Invalid refresh token", 401, "TOKEN_INVALID");
  }
}
