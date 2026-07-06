import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createServer } from "http";

import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { connectRedis } from "./utils/redis";
import { initCloudinary } from "./utils/cloudinary";

import listingRoutes from "./routes/listing.routes";
import imageRoutes from "./routes/image.routes";
import searchRoutes from "./routes/search.routes";
import savedRoutes from "./routes/saved.routes";
import adminListingsRoutes from "./routes/adminListings.routes";

const app = express();
const PORT = process.env.PORT || 4002;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => res.json({ status: "ok", service: "listings", timestamp: new Date().toISOString() }));

app.use("/listings", listingRoutes);
app.use("/listings", imageRoutes);
app.use("/search", searchRoutes);
app.use("/saved", savedRoutes);
app.use("/admin", adminListingsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await connectRedis();
  initCloudinary();
  const server = createServer(app);
  server.listen(PORT, () => logger.info({ port: PORT }, `🏘️  Listings service running on port ${PORT}`));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
}

bootstrap().catch((err) => { logger.error(err, "Failed to start listings service"); process.exit(1); });
