import { env } from "./env.js";

export const databaseConfig = {
  url: env.DATABASE_URL,
  logQueries: env.NODE_ENV === "development",
} as const;

export type DatabaseConfig = typeof databaseConfig;
