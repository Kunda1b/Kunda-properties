import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { SessionPayload } from "@kunda/types";
import * as configModule from "@kunda/config";

const { env, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export interface GatewayRequest extends Request {
  user?: SessionPayload;
}

const PUBLIC_ROUTES: { method: string; path: RegExp }[] = [
  { method: "POST", path: /^\/api\/auth\/register$/ },
  { method: "POST", path: /^\/api\/auth\/login$/ },
  { method: "POST", path: /^\/api\/auth\/verify-email$/ },
  { method: "POST", path: /^\/api\/auth\/resend-otp$/ },
  { method: "POST", path: /^\/api\/auth\/refresh$/ },
  { method: "GET", path: /^\/api\/listings$/ },
  { method: "GET", path: /^\/api\/listings\/[^/]+$/ },
  { method: "GET", path: /^\/health$/ },
  { method: "POST", path: /^\/api\/escrow\/webhook\/stripe$/ },
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some((route) => route.method === method && route.path.test(path));
}

export function authMiddleware(
  req: GatewayRequest,
  res: Response,
  next: NextFunction,
): void {
  if (isPublicRoute(req.method, req.path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "UNAUTHORIZED",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
    req.user = payload;

    req.headers["x-user-id"] = payload.userId;
    req.headers["x-user-email"] = payload.email;
    req.headers["x-user-role"] = payload.role;
    req.headers["x-user-kyc"] = payload.kycStatus;
    req.headers["x-authenticated-by"] = "kunda-gateway";

    logger.info("Request authenticated", {
      userId: payload.userId,
      role: payload.role,
      path: req.path,
    });

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      code: "TOKEN_INVALID",
    });
  }
}
