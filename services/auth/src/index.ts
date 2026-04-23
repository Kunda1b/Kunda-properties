import { app } from "./app";
import { env, logger, SERVICE_PORTS } from "@kunda/config";
import { getRedisClient, prisma } from "@kunda/db";

const PORT = env.PORT === SERVICE_PORTS.GATEWAY ? SERVICE_PORTS.AUTH : env.PORT;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    getRedisClient();

    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start auth service", {
      error: error instanceof Error ? error.message : "Unknown startup error",
    });
    process.exit(1);
  }
}

void bootstrap();
