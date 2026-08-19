import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";
import { logger } from "./logger";

export let redisClient: Redis | null = null;
let redisAvailable = false;

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 5) {
        logger.warn("Redis connection failed after 5 retries. Disabling cache & distributed store.");
        redisAvailable = false;
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
  });

  redisClient.on("connect", () => {
    logger.info("Connected to Redis");
    redisAvailable = true;
  });

  redisClient.on("ready", () => {
    redisAvailable = true;
  });

  redisClient.on("error", (err) => {
    logger.warn({ err: err.message }, "Redis connection error");
    redisAvailable = false;
  });

  redisClient.on("close", () => {
    redisAvailable = false;
  });
}

/**
 * Creates a RedisStore for express-rate-limit if Redis is configured and available.
 * Returns undefined if Redis is not configured, allowing express-rate-limit to fall back to memory store.
 */
export function getRateLimitStore(prefix: string) {
  if (!redisClient) {
    return undefined;
  }
  return new RedisStore({
    sendCommand: async (...args: string[]) => {
      if (!redisClient || !redisAvailable) {
        throw new Error("Redis store unavailable");
      }
      return redisClient.call(args[0], ...args.slice(1)) as any;
    },
    prefix,
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
    if (redisAvailable && redisClient) {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
    }
  } catch (err) {
    logger.warn({ err, key }, "Failed to write to Redis cache");
  }

  return data;
}

/**
 * Invalidate all keys matching a prefix using non-blocking SCAN
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  if (!redisClient || !redisAvailable) return;
  try {
    const stream = redisClient.scanStream({
      match: `${prefix}*`,
      count: 100,
    });

    stream.on("data", async (keys: string[]) => {
      if (keys.length > 0 && redisClient && redisAvailable) {
        await redisClient.del(...keys);
      }
    });

    stream.on("error", (err) => {
      logger.warn({ err, prefix }, "Error scanning keys for Redis invalidation");
    });
  } catch (err) {
    logger.warn({ err, prefix }, "Failed to invalidate Redis cache prefix");
  }
}
