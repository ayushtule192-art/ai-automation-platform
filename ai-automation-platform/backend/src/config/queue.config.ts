import { env } from "./env.js";
import { QUEUE_NAMES } from "../constants/queues.js";

export const queueConfig = {
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
  queues: QUEUE_NAMES,
  workerConcurrency: {
    email: 5,
    calling: 3,
    notification: 10,
  },
} as const;

export type QueueConfig = typeof queueConfig;
