import { Worker, type Job } from "bullmq";
import * as configModule from "@kunda/config";
import type { NotificationJob } from "@kunda/types";
import { sendWhatsApp } from "../channels/whatsapp.channel";
import { createWorkerConnection } from "../queue";

const { QUEUE_NAMES, QUEUE_PREFIX, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export function startWhatsAppWorker(): Worker<NotificationJob> {
  const worker = new Worker<NotificationJob>(
    QUEUE_NAMES.WHATSAPP,
    async (job: Job<NotificationJob>) => {
      logger.info("Processing WhatsApp job", {
        jobId: job.id,
        event: job.data.event,
      });

      await sendWhatsApp(job.data);
    },
    {
      connection: createWorkerConnection(),
      concurrency: 2,
      prefix: QUEUE_PREFIX,
    },
  );

  worker.on("completed", (job) => {
    logger.info("WhatsApp job completed", {
      jobId: job.id,
      event: job.data.event,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("WhatsApp job failed", {
      jobId: job?.id,
      event: job?.data.event,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  logger.info("WhatsApp worker started");
  return worker;
}
