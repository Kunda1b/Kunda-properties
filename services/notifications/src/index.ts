import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import { startEmailWorker } from "./workers/email.worker";
import { startSMSWorker } from "./workers/sms.worker";
import { startWhatsAppWorker } from "./workers/whatsapp.worker";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { getRedisClient } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

async function bootstrap() {
  try {
    getRedisClient();
    logger.info("Redis connected");

    const emailWorker = startEmailWorker();
    const smsWorker = startSMSWorker();
    const whatsappWorker = startWhatsAppWorker();

    logger.info("All notification workers running");
    logger.info("Listening on queues: email, sms, whatsapp");

    const shutdown = async () => {
      logger.info("Shutting down workers...");

      await Promise.all([
        emailWorker.close(),
        smsWorker.close(),
        whatsappWorker.close(),
      ]);

      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start notifications service", { error });
    process.exit(1);
  }
}

bootstrap();
