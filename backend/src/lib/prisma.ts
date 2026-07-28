import { PrismaClient } from "@prisma/client";
import { databaseConfig } from "../config/database.config.js";
import { isDevelopment } from "../config/env.js";

/**
 * Prisma client singleton.
 * Prevents multiple instances during hot-reload in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: databaseConfig.logQueries
      ? [{ emit: "event", level: "query" }, "error", "warn"]
      : ["error"],
  });

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

/** Gracefully disconnect Prisma on process shutdown */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
