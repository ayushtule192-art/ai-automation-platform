import { Redis } from "ioredis";
import { redisConfig } from "../config/redis.config.js";
import { isDevelopment } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Redis client singleton for caching and pub/sub.
 * BullMQ uses a separate connection via redisConfig.bullmqConnection.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(redisConfig.url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times: number): number | null {
      if (times > 10) return null;
      return Math.min(times * 200, 5000);
    },
  });

  client.on("error", (error: Error) => {
    logger.error("Redis connection error", { error: error.message });
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (isDevelopment) {
  globalForRedis.redis = redis;
}

/** BullMQ-compatible connection options */
export const bullmqConnection = redisConfig.bullmqConnection;

/** Connect Redis client — call during server bootstrap */
export async function connectRedis(): Promise<void> {
  if (redis.status === "ready") return;
  await redis.connect();
}

/** Gracefully disconnect Redis on process shutdown */
export async function disconnectRedis(): Promise<void> {
  if (redis.status === "end") return;
  await redis.quit();
}

/** Build a namespaced cache key */
export function cacheKey(...parts: string[]): string {
  return [redisConfig.cachePrefix, ...parts].join(":");
}
