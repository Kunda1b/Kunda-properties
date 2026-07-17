import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors";
interface TokenPayload { sub: string; role: string; }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
  try {
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET!) as TokenPayload;
    (req as any).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "TOKEN_INVALID"));
  }
}
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role || !roles.includes(role)) return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    next();
  };
}
