import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createServer } from "http";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { initCloudinary } from "./utils/cloudinary";

import documentRoutes from "./routes/document.routes";
import adminDocsRoutes from "./routes/adminDocs.routes";

const app = express();
const PORT = process.env.PORT || 4004;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => res.json({ status: "ok", service: "documents", timestamp: new Date().toISOString() }));

app.use("/documents", documentRoutes);
app.use("/admin", adminDocsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  initCloudinary();
  const server = createServer(app);
  server.listen(PORT, () => logger.info({ port: PORT }, `📄 Documents service running on port ${PORT}`));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

bootstrap().catch((err) => { logger.error(err, "Failed to start documents service"); process.exit(1); });
