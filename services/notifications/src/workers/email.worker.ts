import { Worker, type Job } from "bullmq";
import * as configModule from "@kunda/config";
import type { NotificationJob } from "@kunda/types";
import { sendEmail } from "../channels/email.channel";
import { createWorkerConnection } from "../queue";

const { QUEUE_NAMES, QUEUE_PREFIX, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export function startEmailWorker(): Worker<NotificationJob> {
  const worker = new Worker<NotificationJob>(
    QUEUE_NAMES.EMAIL,
    async (job: Job<NotificationJob>) => {
      logger.info("Processing email job", {
        jobId: job.id,
        event: job.data.event,
      });

      await sendEmail(job.data);
    },
    {
      connection: createWorkerConnection(),
      concurrency: 5,
      prefix: QUEUE_PREFIX,
    },
  );

  worker.on("completed", (job) => {
    logger.info("Email job completed", {
      jobId: job.id,
      event: job.data.event,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("Email job failed", {
      jobId: job?.id,
      event: job?.data.event,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  logger.info("Email worker started");
  return worker;
}
