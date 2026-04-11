import type { NextFunction, Request, Response } from "express";
import * as configModule from "@kunda/config";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    const payload = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    if (res.statusCode >= 500) {
      logger.error(message, payload);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(message, payload);
      return;
    }

    logger.info(message, payload);
  });

  next();
}
