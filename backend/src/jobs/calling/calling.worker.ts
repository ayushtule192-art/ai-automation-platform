import { Worker } from "bullmq";
import { queueConfig } from "../../config/queue.config.js";
import { bullmqConnection } from "../../lib/redis.js";
import { JOB_NAMES, QUEUE_NAMES } from "../../constants/queues.js";
import { callingService } from "../../services/calls/calling.service.js";
import { logger } from "../../lib/logger.js";

/** BullMQ worker for executing scheduled outbound calls */
export function createCallingWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.CALLING,
    async (job) => {
      if (job.name === JOB_NAMES.CALLING.EXECUTE_CALL) {
        const { callId } = job.data as { callId: string };
        logger.info("Processing call job", { callId, jobId: job.id });
        await callingService.executeCall(callId);
      }
    },
    {
      connection: bullmqConnection,
      prefix: queueConfig.prefix,
      concurrency: queueConfig.workerConcurrency.calling,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error("Call job failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  return worker;
}
