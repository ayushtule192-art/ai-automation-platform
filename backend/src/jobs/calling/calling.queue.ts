import { Queue } from "bullmq";
import { queueConfig } from "../../config/queue.config.js";
import { bullmqConnection } from "../../lib/redis.js";
import { JOB_NAMES, QUEUE_NAMES } from "../../constants/queues.js";
import { logger } from "../../lib/logger.js";

let callingQueue: Queue | null = null;

function getQueue(): Queue | null {
  try {
    if (!callingQueue) {
      callingQueue = new Queue(QUEUE_NAMES.CALLING, {
        connection: bullmqConnection,
        prefix: queueConfig.prefix,
        defaultJobOptions: queueConfig.defaultJobOptions,
      });
    }
    return callingQueue;
  } catch {
    return null;
  }
}

/** Schedule a call execution job — uses BullMQ delay or immediate */
export async function scheduleCallExecution(
  callId: string,
  scheduledAt: Date
): Promise<void> {
  const queue = getQueue();
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());

  if (queue) {
    await queue.add(
      JOB_NAMES.CALLING.EXECUTE_CALL,
      { callId },
      { delay, jobId: `call-${callId}` }
    );
    logger.info("Call job queued", { callId, delayMs: delay });
  } else {
    // Fallback when Redis unavailable — execute after delay in-process
    setTimeout(() => {
      void import("../../services/calls/calling.service.js").then(({ callingService }) =>
        callingService.executeCall(callId)
      );
    }, delay);
    logger.warn("Redis unavailable — using in-process call scheduler", { callId });
  }
}

/** Process due scheduled calls (polling fallback) */
export async function processDueCalls(): Promise<void> {
  const { callRepository } = await import("../../repositories/calls/call.repository.js");
  const { callingService } = await import("../../services/calls/calling.service.js");

  const dueCalls = await callRepository.findDueScheduled(10);
  for (const call of dueCalls) {
    await callingService.executeCall(call.id);
  }
}

export function startCallScheduler(intervalMs = 30_000): NodeJS.Timeout {
  return setInterval(() => {
    void processDueCalls();
  }, intervalMs);
}
