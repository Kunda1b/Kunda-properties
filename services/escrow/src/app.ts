import cors from "cors";
import express from "express";
import helmet from "helmet";
import * as configModule from "@kunda/config";
import { escrowRoutes } from "./routes/escrow.routes";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);

app.use("/escrow/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "escrow",
    timestamp: new Date().toISOString(),
  });
});

app.use("/escrow", escrowRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
  });
});

export { app };
