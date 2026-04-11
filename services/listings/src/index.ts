import { app } from "./app";
import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { getRedisClient, prisma } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

const PORT = 4002;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    getRedisClient();

    app.listen(PORT, () => {
      logger.info(`Listings service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start listings service", {
      error: error instanceof Error ? error.message : "Unknown startup error",
    });
    process.exit(1);
  }
}

void bootstrap();
