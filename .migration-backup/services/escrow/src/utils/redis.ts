import { Redis } from "ioredis";
import { logger } from "./logger";
let _redis: Redis;
export async function connectRedis(): Promise<Redis> {
  _redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy: (t) => Math.min(t * 100, 3000),
    lazyConnect: true,
  });
  _redis.on("error", (err) => logger.error({ err }, "Redis error"));
  await _redis.connect();
  return _redis;
}
export { _redis as redis };
