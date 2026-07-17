import type { Request, Response, NextFunction } from "express";
import { sanitizeValue } from "../lib/sanitize.js";

/** Recursively sanitize req.body string fields against XSS / control chars. */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
}
