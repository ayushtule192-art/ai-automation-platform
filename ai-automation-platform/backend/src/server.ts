import type { Worker } from "bullmq";
import { createApp } from "./app.js";
import { appConfig } from "./config/app.config.js";
import { disconnectRedis } from "./lib/redis.js";
import { disconnectPrisma } from "./lib/prisma.js";
import { logger } from "./lib/logger.js";
import { createCallingWorker } from "./jobs/calling/calling.worker.js";
import { startCallScheduler } from "./jobs/calling/calling.queue.js";

async function bootstrap(): Promise<void> {
  const app = createApp();

  let callingWorker: Worker | null = null;
  let callScheduler: NodeJS.Timeout | null = null;

  try {
    callingWorker = createCallingWorker();
    logger.info("Calling queue worker started");
  } catch (error) {
    logger.warn("Calling worker unavailable — using in-process scheduler", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  callScheduler = startCallScheduler();

  const server = app.listen(appConfig.port, () => {
    logger.info(`Server running on ${appConfig.apiUrl}`, {
      env: appConfig.nodeEnv,
      port: appConfig.port,
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    if (callScheduler) clearInterval(callScheduler);
    if (callingWorker) await callingWorker.close();

    server.close(async () => {
      await disconnectPrisma();
      await disconnectRedis();
      logger.info("Server shut down complete");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  logger.error("Failed to start server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
