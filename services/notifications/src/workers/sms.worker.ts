import { Worker, type Job } from "bullmq";
import * as configModule from "@kunda/config";
import type { NotificationJob } from "@kunda/types";
import { sendSMS } from "../channels/sms.channel";
import { createWorkerConnection } from "../queue";

const { QUEUE_NAMES, QUEUE_PREFIX, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export function startSMSWorker(): Worker<NotificationJob> {
  const worker = new Worker<NotificationJob>(
    QUEUE_NAMES.SMS,
    async (job: Job<NotificationJob>) => {
      logger.info("Processing SMS job", {
        jobId: job.id,
        event: job.data.event,
      });

      await sendSMS(job.data);
    },
    {
      connection: createWorkerConnection(),
      concurrency: 3,
      prefix: QUEUE_PREFIX,
    },
  );

  worker.on("completed", (job) => {
    logger.info("SMS job completed", {
      jobId: job.id,
      event: job.data.event,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("SMS job failed", {
      jobId: job?.id,
      event: job?.data.event,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  logger.info("SMS worker started");
  return worker;
}
