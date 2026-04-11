import { app } from "./app";
import { logger } from "@kunda/config";
import { prisma } from "@kunda/db";
import { ensureBucketExists } from "./utils/s3";

const PORT = 4004;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    await ensureBucketExists();

    app.listen(PORT, () => {
      logger.info(`Documents service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start documents service", {
      error: error instanceof Error ? error.message : "Unknown startup error",
    });
    process.exit(1);
  }
}

void bootstrap();
