import { Queue } from "bullmq";
import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import type { NotificationJob } from "@kunda/types";

const { QUEUE_NAMES, QUEUE_PREFIX, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { getRedisClient } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

let emailQueue: Queue<NotificationJob> | null = null;
let smsQueue: Queue<NotificationJob> | null = null;
let whatsappQueue: Queue<NotificationJob> | null = null;

function getConnection() {
  return { connection: getRedisClient() };
}

export function createWorkerConnection() {
  return getRedisClient().duplicate({
    maxRetriesPerRequest: null,
  });
}

export function getEmailQueue(): Queue<NotificationJob> {
  if (!emailQueue) {
    emailQueue = new Queue<NotificationJob>(QUEUE_NAMES.EMAIL, {
      ...getConnection(),
      prefix: QUEUE_PREFIX,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }

  return emailQueue;
}

export function getSMSQueue(): Queue<NotificationJob> {
  if (!smsQueue) {
    smsQueue = new Queue<NotificationJob>(QUEUE_NAMES.SMS, {
      ...getConnection(),
      prefix: QUEUE_PREFIX,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }

  return smsQueue;
}

export function getWhatsAppQueue(): Queue<NotificationJob> {
  if (!whatsappQueue) {
    whatsappQueue = new Queue<NotificationJob>(QUEUE_NAMES.WHATSAPP, {
      ...getConnection(),
      prefix: QUEUE_PREFIX,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "fixed", delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }

  return whatsappQueue;
}

export async function enqueueNotification(
  job: NotificationJob,
): Promise<void> {
  try {
    switch (job.channel) {
      case "EMAIL":
        await getEmailQueue().add(job.event, job, { priority: 1 });
        break;
      case "SMS":
        await getSMSQueue().add(job.event, job, { priority: 2 });
        break;
      case "WHATSAPP":
        await getWhatsAppQueue().add(job.event, job, { priority: 1 });
        break;
    }

    logger.info("Notification enqueued", {
      event: job.event,
      channel: job.channel,
      recipient: job.recipient.email || job.recipient.phone,
    });
  } catch (error) {
    logger.error("Failed to enqueue notification", {
      event: job.event,
      channel: job.channel,
      error: error instanceof Error ? error.message : "Unknown queue error",
    });
    throw error;
  }
}
