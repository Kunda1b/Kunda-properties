import type { Request, Response, NextFunction } from "express";

/**
 * Security response headers: CSP, clickjacking, MIME sniffing, referrer, etc.
 * Applied to all API responses.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", [
    "default-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join("; "));

  // MIME / XSS browser guards
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "0"); // modern browsers use CSP; disable legacy filter
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Do not leak tech stack
  res.removeHeader("X-Powered-By");

  next();
}
