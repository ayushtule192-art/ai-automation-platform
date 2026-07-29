import { env } from "./env.js";

export const redisConfig = {
  url: env.REDIS_URL,
  /** BullMQ requires maxRetriesPerRequest to be null */
  bullmqConnection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  },
  /** Default TTL for cached keys (seconds) */
  defaultTtlSeconds: 3600,
  /** Key prefix for application cache entries */
  cachePrefix: `${env.QUEUE_PREFIX}:cache`,
} as const;

export type RedisConfig = typeof redisConfig;
