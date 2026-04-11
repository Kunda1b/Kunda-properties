import Redis from "ioredis";
import { logger } from "@kunda/config";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) {
    return client;
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379";

  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        logger.error("Redis connection failed after 5 retries");
        return null;
      }

      return Math.min(times * 100, 2000);
    },
    reconnectOnError(error) {
      logger.warn("Redis reconnecting after error", { error: error.message });
      return true;
    },
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  client.on("error", (error) => {
    logger.error("Redis error", { error: error.message });
  });

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    logger.info("Redis disconnected");
  }
}
