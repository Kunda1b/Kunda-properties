import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import { createServer } from "http";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authenticate } from "./middleware/authenticate";
import { requestId } from "./middleware/requestId";
import { connectRedis } from "./utils/redis";

const app = express();
const PORT = process.env.PORT || 4000;

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  listings: process.env.LISTINGS_SERVICE_URL || "http://localhost:4002",
  escrow: process.env.ESCROW_SERVICE_URL || "http://localhost:4003",
  documents: process.env.DOCUMENTS_SERVICE_URL || "http://localhost:4004",
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:4005",
};

app.set("trust proxy", 1);
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
}));
app.use(pinoHttp({ logger }));
app.use(requestId);
app.use(express.json({ limit: "50mb" }));

const globalLimiter = rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: { success: false, error: "Too many auth attempts" } });
const adminLimiter = rateLimit({ windowMs: 60_000, max: 120 });

app.use(globalLimiter);

app.get("/health", (_, res) => res.json({ status: "ok", service: "gateway", timestamp: new Date().toISOString(), uptime: process.uptime() }));

app.get("/health/all", async (_, res) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([name, url]) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      try {
        const r = await fetch(`${url}/health`, { signal: ctrl.signal });
        clearTimeout(t);
        return { name, status: r.ok ? "up" : "degraded" };
      } catch { clearTimeout(t); return { name, status: "down" }; }
    })
  );
  const results = checks.map((c) => (c.status === "fulfilled" ? c.value : { name: "unknown", status: "down" }));
  res.status(results.every((r) => r.status === "up") ? 200 : 207).json({ gateway: "up", services: results });
});

function proxy(target: string, options: Record<string, any> = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res: any) => {
        logger.error({ err, target }, "Proxy error");
        res.status(502).json({ success: false, error: "Service temporarily unavailable", code: "SERVICE_UNAVAILABLE" });
      },
    },
    ...options,
  });
}

// ── Auth ─────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, proxy(SERVICES.auth, { pathRewrite: { "^/api/auth": "/auth" } }));
app.use("/api/kyc", authenticate, proxy(SERVICES.auth, { pathRewrite: { "^/api/kyc": "/kyc" } }));
app.use("/api/profile", authenticate, proxy(SERVICES.auth, { pathRewrite: { "^/api/profile": "/profile" } }));

// ── Listings ─────────────────────────────────────────────────
app.use("/api/search", proxy(SERVICES.listings, { pathRewrite: { "^/api/search": "/search" } }));
app.use("/api/listings", proxy(SERVICES.listings, { pathRewrite: { "^/api/listings": "/listings" } }));
app.use("/api/saved", authenticate, proxy(SERVICES.listings, { pathRewrite: { "^/api/saved": "/saved" } }));

// ── Escrow & Offers ──────────────────────────────────────────
app.use("/api/escrow", authenticate, proxy(SERVICES.escrow, { pathRewrite: { "^/api/escrow": "/escrow" } }));
app.use("/api/offers", authenticate, proxy(SERVICES.escrow, { pathRewrite: { "^/api/offers": "/offers" } }));
app.use("/api/webhooks/stripe", proxy(SERVICES.escrow, { pathRewrite: { "^/api/webhooks/stripe": "/webhooks/stripe" } }));

// ── Documents ────────────────────────────────────────────────
app.use("/api/documents", authenticate, proxy(SERVICES.documents, { pathRewrite: { "^/api/documents": "/documents" } }));

// ── Notifications ────────────────────────────────────────────
app.use("/api/notifications", authenticate, proxy(SERVICES.notifications, { pathRewrite: { "^/api/notifications": "/notifications" } }));

// ── Admin (each backing service verifies ADMIN role independently) ──
app.use("/api/admin/listings", adminLimiter, authenticate, proxy(SERVICES.listings, { pathRewrite: { "^/api/admin": "/admin" } }));
app.use("/api/admin/escrow", adminLimiter, authenticate, proxy(SERVICES.escrow, { pathRewrite: { "^/api/admin": "/admin" } }));
app.use("/api/admin/documents", adminLimiter, authenticate, proxy(SERVICES.documents, { pathRewrite: { "^/api/admin": "/admin" } }));
app.use("/api/admin/notifications", adminLimiter, authenticate, proxy(SERVICES.notifications, { pathRewrite: { "^/api/admin": "/admin" } }));
// stats, users, kyc, audit-logs, exchange-rates → auth service
app.use("/api/admin", adminLimiter, authenticate, proxy(SERVICES.auth, { pathRewrite: { "^/api/admin": "/admin" } }));

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await connectRedis();
  const server = createServer(app);
  server.listen(PORT, () => logger.info({ port: PORT, services: SERVICES }, `🚪 API Gateway running on port ${PORT}`));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
}

bootstrap().catch((err) => { logger.error(err, "Failed to start gateway"); process.exit(1); });
