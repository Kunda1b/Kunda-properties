import { Router } from "express";
import * as configModule from "@kunda/config";
import { SERVICE_REGISTRY } from "../utils/registry";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const router = Router();

router.get("/health", async (_req, res) => {
  const checks = await Promise.allSettled(
    SERVICE_REGISTRY.map(async (service) => {
      const start = Date.now();
      const response = await fetch(`${service.target}${service.healthPath}`);
      const duration = Date.now() - start;
      const data = (await response.json()) as Record<string, unknown>;

      return {
        ...data,
        service: service.name,
        status: response.ok ? "healthy" : "degraded",
        duration,
      };
    }),
  );

  const services = checks.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    logger.warn("Health check failed", {
      service: SERVICE_REGISTRY[index]?.name,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });

    return {
      service: SERVICE_REGISTRY[index]?.name,
      status: "unreachable",
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });

  const allHealthy = services.every((service) => service.status === "healthy");

  res.status(allHealthy ? 200 : 207).json({
    status: allHealthy ? "ok" : "degraded",
    gateway: "kunda-gateway",
    timestamp: new Date().toISOString(),
    services,
  });
});

export { router as healthRoutes };
