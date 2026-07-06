import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createServer } from "http";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { connectRedis } from "./utils/redis";

import escrowRoutes from "./routes/escrow.routes";
import offerRoutes from "./routes/offer.routes";
import webhookRoutes from "./routes/webhook.routes";
import adminEscrowRoutes from "./routes/adminEscrow.routes";

const app = express();
const PORT = process.env.PORT || 4003;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(pinoHttp({ logger }));

// Raw body for Stripe webhooks MUST come before json parser
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => res.json({ status: "ok", service: "escrow", timestamp: new Date().toISOString() }));

app.use("/escrow", escrowRoutes);
app.use("/offers", offerRoutes);
app.use("/admin", adminEscrowRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await connectRedis();
  const server = createServer(app);
  server.listen(PORT, () => logger.info({ port: PORT }, `💰 Escrow service running on port ${PORT}`));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
}

bootstrap().catch((err) => { logger.error(err, "Failed to start escrow service"); process.exit(1); });
