import { env } from "./env.js";

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiUrl: env.API_URL,
  corsOrigin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

export type AppConfig = typeof appConfig;
