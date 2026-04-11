import { app } from "./app";
import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";

const { env, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { getRedisClient, prisma } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

const PORT = env.PORT === 4000 ? 4003 : env.PORT;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    getRedisClient();

    app.listen(PORT, () => {
      logger.info(`Escrow service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start escrow service", {
      error: error instanceof Error ? error.message : "Unknown startup error",
    });
    process.exit(1);
  }
}

void bootstrap();
