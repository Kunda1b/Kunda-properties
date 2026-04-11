import type { NextFunction, Request, Response } from "express";
import type { SessionPayload } from "@kunda/types";
import { verifyToken } from "../utils/token";

export interface AuthRequest extends Request {
  user?: SessionPayload;
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getForwardedUser(req: Request): SessionPayload | undefined {
  const userId = getHeaderValue(req.headers["x-user-id"]);
  const email = getHeaderValue(req.headers["x-user-email"]);
  const role = getHeaderValue(req.headers["x-user-role"]);
  const kycStatus = getHeaderValue(req.headers["x-user-kyc"]);

  if (!userId || !email || !role || !kycStatus) {
    return undefined;
  }

  return {
    userId,
    email,
    role: role as SessionPayload["role"],
    kycStatus: kycStatus as SessionPayload["kycStatus"],
  };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const forwardedUser = getForwardedUser(req);

  if (forwardedUser) {
    req.user = forwardedUser;
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
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      code: "TOKEN_INVALID",
    });
  }
}

export function requireRole(...roles: SessionPayload["role"][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action",
        code: "FORBIDDEN",
      });
      return;
    }

    next();
  };
}

export function requireKYC(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "UNAUTHORIZED",
    });
    return;
  }

  if (req.user.kycStatus !== "APPROVED") {
    res.status(403).json({
      success: false,
      error: "Identity verification is required for this action",
      code: "KYC_REQUIRED",
    });
    return;
  }

  next();
}
