import { getRedisClient } from "@kunda/db";

export async function setJsonState<T>(namespace: string, id: string, value: T, ttlSeconds?: number) {
  const redis = getRedisClient();
  const key = `${namespace}:${id}`;
  const serialized = JSON.stringify(value);

  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
    return;
  }

  await redis.set(key, serialized);
}

export async function getJsonState<T>(namespace: string, id: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(`${namespace}:${id}`);
  return value ? (JSON.parse(value) as T) : null;
}

export async function deleteJsonState(namespace: string, id: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`${namespace}:${id}`);
}
