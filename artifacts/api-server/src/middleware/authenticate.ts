import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";

export type AuthUser = { id: string; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer "))
    return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
  try {
    const payload = verifyAccessToken(h.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

/** JWT role check only (fast path). Prefer requireFreshRole for admin mutations. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role))
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    next();
  };
}

/**
 * Re-load role from DB so demotions / suspensions take effect immediately
 * (JWT may still carry a stale elevated role until access token expires).
 */
export function requireFreshRole(...roles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));

      const [user] = await db
        .select({
          id: users.id,
          role: users.role,
          isActive: users.isActive,
          isSuspended: users.isSuspended,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || !user.isActive) {
        return next(new AppError("Account inactive", 401, "ACCOUNT_INACTIVE"));
      }
      if (user.isSuspended) {
        return next(new AppError("Account suspended", 403, "ACCOUNT_SUSPENDED"));
      }
      if (!roles.includes(user.role)) {
        return next(new AppError("Forbidden", 403, "FORBIDDEN"));
      }

      req.user = { id: user.id, role: user.role };
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const requireAdmin = requireFreshRole("ADMIN", "SUPER_ADMIN");
export const requireSellerOrAgent = requireRole("SELLER", "AGENT", "ADMIN", "SUPER_ADMIN");
export const requireAgent = requireRole("AGENT", "ADMIN", "SUPER_ADMIN");
