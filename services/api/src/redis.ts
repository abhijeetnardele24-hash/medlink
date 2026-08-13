import Redis from "ioredis";
import { logger } from "./logger";

export let redisClient: Redis | null = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    // Retry strategy for graceful degradation
    retryStrategy(times) {
      if (times > 5) {
        logger.warn("Redis connection failed after 5 retries. Disabling cache.");
        redisAvailable = false;
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
  });

  redisClient.on("connect", () => {
    logger.info("Connected to Redis for caching");
    redisAvailable = true;
  });

  redisClient.on("error", (err) => {
    logger.warn({ err }, "Redis connection error");
    redisAvailable = false;
  });
}

/**
 * Cache helper that gracefully falls back to skipping cache if Redis is unavailable
 */
export async function withCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  if (!redisClient || !redisAvailable) {
    return fetcher();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    logger.warn({ err, key }, "Failed to read from Redis cache");
  }

  // Fetch fresh data
  const data = await fetcher();

  try {
    if (redisAvailable) {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
    }
  } catch (err) {
    logger.warn({ err, key }, "Failed to write to Redis cache");
  }

  return data;
}

export async function invalidateCachePrefix(prefix: string): Promise<void> {
  if (!redisClient || !redisAvailable) return;
  try {
    const keys = await redisClient.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    logger.warn({ err, prefix }, "Failed to invalidate Redis cache prefix");
  }
}
