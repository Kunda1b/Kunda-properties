import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(422).json({ success: false, error: err.message, code: err.code, errors: err.errors });
  }
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err }, err.message);
    return res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ success: false, error: "Internal server error", code: "INTERNAL_ERROR" });
}
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found`, code: "NOT_FOUND" });
}
