import { getRedisClient } from "@kunda/db";

type WindowResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const inMemoryWindows = new Map<string, { count: number; expiresAt: number }>();

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<WindowResult> {
  try {
    const redis = getRedisClient();
    const namespacedKey = `rate-limit:${key}`;
    const count = await redis.incr(namespacedKey);

    if (count === 1) {
      await redis.expire(namespacedKey, windowSeconds);
    }

    const ttl = await redis.ttl(namespacedKey);
    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      retryAfterSeconds: Math.max(ttl, 1),
    };
  } catch {
    const now = Date.now();
    const windowEnd = now + windowSeconds * 1000;
    const current = inMemoryWindows.get(key);

    if (!current || current.expiresAt <= now) {
      inMemoryWindows.set(key, { count: 1, expiresAt: windowEnd });
      return {
        allowed: true,
        remaining: limit - 1,
        retryAfterSeconds: windowSeconds,
      };
    }

    current.count += 1;

    return {
      allowed: current.count <= limit,
      remaining: Math.max(limit - current.count, 0),
      retryAfterSeconds: Math.max(Math.ceil((current.expiresAt - now) / 1000), 1),
    };
  }
}
