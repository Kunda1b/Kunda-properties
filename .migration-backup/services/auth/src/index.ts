import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createServer } from "http";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { connectRedis } from "./utils/redis";

import authRoutes from "./routes/auth.routes";
import kycRoutes from "./routes/kyc.routes";
import profileRoutes from "./routes/profile.routes";
import adminStatsRoutes from "./routes/adminStats.routes";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: "auth",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.use("/auth", authRoutes);
app.use("/kyc", kycRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminStatsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectRedis();
    logger.info("Redis connected");

    const server = createServer(app);
    server.listen(PORT, () => {
      logger.info({ port: PORT }, `🔐 Auth service running on port ${PORT}`);
    });

    const shutdown = (signal: string) => {
      logger.info({ signal }, "Shutting down auth service...");
      server.close(() => process.exit(0));
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error({ error }, "Failed to start auth service");
    process.exit(1);
  }
}

bootstrap();
