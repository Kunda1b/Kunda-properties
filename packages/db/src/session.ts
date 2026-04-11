import { getRedisClient } from "./redis";

const SESSION_PREFIX = "session:";
const OTP_PREFIX = "otp:";

export async function setSession(
  token: string,
  userId: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`${SESSION_PREFIX}${token}`, ttlSeconds, userId);
}

export async function getSession(token: string): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(`${SESSION_PREFIX}${token}`);
}

export async function deleteSession(token: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`${SESSION_PREFIX}${token}`);
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${SESSION_PREFIX}*`);
  const pipeline = redis.pipeline();

  for (const key of keys) {
    const value = await redis.get(key);
    if (value === userId) {
      pipeline.del(key);
    }
  }

  await pipeline.exec();
}

export async function setOTP(
  identifier: string,
  code: string,
  ttlSeconds = 600,
): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`${OTP_PREFIX}${identifier}`, ttlSeconds, code);
}

export async function verifyOTP(
  identifier: string,
  code: string,
): Promise<boolean> {
  const redis = getRedisClient();
  const stored = await redis.get(`${OTP_PREFIX}${identifier}`);

  if (!stored || stored !== code) {
    return false;
  }

  await redis.del(`${OTP_PREFIX}${identifier}`);
  return true;
}
