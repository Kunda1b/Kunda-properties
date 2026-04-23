import type { NotificationJob } from "@kunda/types";

function buildRedisConnection(redisUrl: string) {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    db: url.pathname && url.pathname !== "/" ? Number(url.pathname.slice(1)) : 0,
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export async function publishNotification(
  job: NotificationJob,
): Promise<void> {
  const { Queue } = await import("bullmq");
  const { QUEUE_NAMES, QUEUE_PREFIX } = await import("./constants.js");

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const queueName =
    job.channel === "EMAIL"
      ? QUEUE_NAMES.EMAIL
      : job.channel === "SMS"
        ? QUEUE_NAMES.SMS
        : QUEUE_NAMES.WHATSAPP;

  const queue = new Queue(queueName, {
    connection: buildRedisConnection(redisUrl),
    prefix: QUEUE_PREFIX,
  });

  await queue.add(job.event, job);
  await queue.close();
}
