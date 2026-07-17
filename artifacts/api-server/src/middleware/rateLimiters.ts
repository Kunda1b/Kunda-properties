import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

function limiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max: isTest ? 10_000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: message, code: "RATE_LIMITED" },
  });
}

/** Global API ceiling (per IP). */
export const globalLimiter = limiter(15 * 60 * 1000, 600, "Too many requests, please slow down.");

/** Auth: login, register, password reset. */
export const authLimiter = limiter(
  15 * 60 * 1000,
  20,
  "Too many authentication attempts. Try again in 15 minutes.",
);

/** Offers create / respond. */
export const offersLimiter = limiter(
  15 * 60 * 1000,
  30,
  "Too many offer actions. Try again later.",
);

/** KYC submit + document upload. */
export const kycLimiter = limiter(
  60 * 60 * 1000,
  15,
  "Too many KYC submissions. Try again in an hour.",
);

/** Document metadata registration. */
export const documentsLimiter = limiter(
  15 * 60 * 1000,
  40,
  "Too many document uploads. Try again later.",
);

/** Escrow state-changing actions. */
export const escrowLimiter = limiter(
  15 * 60 * 1000,
  20,
  "Too many escrow actions. Try again later.",
);

/** Admin mutations. */
export const adminLimiter = limiter(
  15 * 60 * 1000,
  120,
  "Too many admin actions. Try again later.",
);
