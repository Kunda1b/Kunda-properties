import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createServer } from "http";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { connectRedis } from "./utils/redis";
import { initFirebase } from "./utils/firebase";
import { startNotificationWorker } from "./workers/notification.worker";

import notificationRoutes from "./routes/notification.routes";
import adminNotifsRoutes from "./routes/adminNotifs.routes";

const app = express();
const PORT = process.env.PORT || 4005;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_, res) => res.json({ status: "ok", service: "notifications", timestamp: new Date().toISOString() }));

app.use("/notify", notificationRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin", adminNotifsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await connectRedis();
  initFirebase();
  await startNotificationWorker();
  const server = createServer(app);
  server.listen(PORT, () => logger.info({ port: PORT }, `🔔 Notifications service running on port ${PORT}`));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

bootstrap().catch((err) => { logger.error(err, "Failed to start notifications service"); process.exit(1); });
