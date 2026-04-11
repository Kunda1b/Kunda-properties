import type { Socket } from "node:net";
import type { Request, Response } from "express";
import { Router } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import * as configModule from "@kunda/config";
import { authRateLimit, escrowRateLimit } from "../middleware/rate-limit.middleware";
import { SERVICE_REGISTRY, findService } from "../utils/registry";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const router = Router();

function buildServiceUnavailableHandler(serviceName: string) {
  return (error: Error, _req: Request, res: Response | Socket) => {
    logger.error("Proxy error", {
      service: serviceName,
      error: error.message,
    });

    if (!("status" in res) || res.headersSent) {
      return;
    }

    res.status(502).json({
        success: false,
        error: `${serviceName} service is temporarily unavailable`,
        code: "SERVICE_UNAVAILABLE",
      });
  };
}

export const stripeWebhookProxy = createProxyMiddleware({
  pathFilter: "/api/escrow/webhook/stripe",
  target: "http://localhost:4003",
  changeOrigin: true,
  pathRewrite: (path) => path.replace("/api/escrow", "/escrow"),
  on: {
    error: buildServiceUnavailableHandler("escrow"),
  },
});

for (const service of SERVICE_REGISTRY) {
  const proxy = createProxyMiddleware({
    pathFilter: service.pathPrefix,
    target: service.target,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(service.pathPrefix, `/${service.name}`),
    on: {
      proxyReq: fixRequestBody,
      error: buildServiceUnavailableHandler(service.name),
    },
  });

  if (service.name === "auth") {
    router.use(service.pathPrefix, authRateLimit);
    router.use(proxy);
  } else if (service.name === "escrow") {
    router.use(service.pathPrefix, escrowRateLimit);
    router.use(proxy);
  } else {
    router.use(proxy);
  }
}

router.use((req, res) => {
  const service = findService(req.path);

  if (service) {
    res.status(502).json({
      success: false,
      error: `${service.name} service is temporarily unavailable`,
      code: "SERVICE_UNAVAILABLE",
    });
    return;
  }

  res.status(404).json({
    success: false,
    error: "Route not found",
    code: "NOT_FOUND",
  });
});

export { router as proxyRoutes };
