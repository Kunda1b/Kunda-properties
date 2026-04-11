import cors from "cors";
import express from "express";
import helmet from "helmet";
import { authMiddleware } from "./middleware/auth.middleware";
import { requestLogger } from "./middleware/logger.middleware";
import { globalRateLimit } from "./middleware/rate-limit.middleware";
import { healthRoutes } from "./routes/health.routes";
import { proxyRoutes, stripeWebhookProxy } from "./routes/proxy.routes";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://kundaproperties.gm",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "x-api-version"],
  }),
);

app.use(globalRateLimit);
app.use(requestLogger);

app.use(healthRoutes);
app.use(stripeWebhookProxy);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(authMiddleware);
app.use(proxyRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    code: "NOT_FOUND",
  });
});

export { app };
