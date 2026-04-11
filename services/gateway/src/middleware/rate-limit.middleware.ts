import rateLimit from "express-rate-limit";
import * as configModule from "@kunda/config";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests - please try again in 15 minutes",
    code: "RATE_LIMITED",
  },
  handler: (req, res, _next, options) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json(options.message);
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many auth attempts - please wait 15 minutes",
    code: "AUTH_RATE_LIMITED",
  },
  handler: (req, res, _next, options) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json(options.message);
  },
});

export const escrowRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many escrow requests - please try again later",
    code: "ESCROW_RATE_LIMITED",
  },
});
