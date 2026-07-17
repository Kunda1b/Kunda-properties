import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer "))
    return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
  try {
    const payload = verifyAccessToken(h.slice(7));
    (req as any).user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role || !roles.includes(role))
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    next();
  };
}
