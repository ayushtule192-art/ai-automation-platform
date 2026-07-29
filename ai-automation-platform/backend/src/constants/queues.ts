/** BullMQ queue names — used by producers and workers */
export const QUEUE_NAMES = {
  EMAIL: "email-queue",
  CALLING: "calling-queue",
  NOTIFICATION: "notification-queue",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Job names within each queue */
export const JOB_NAMES = {
  EMAIL: {
    SEND_WELCOME: "send-welcome-email",
    SEND_PASSWORD_RESET: "send-password-reset-email",
    SEND_ORDER_CONFIRMATION: "send-order-confirmation-email",
  },
  CALLING: {
    SCHEDULE_CALL: "schedule-call",
    EXECUTE_CALL: "execute-call",
    PROCESS_TRANSCRIPT: "process-call-transcript",
  },
  NOTIFICATION: {
    PUSH: "push-notification",
    IN_APP: "in-app-notification",
    REALTIME: "realtime-notification",
  },
} as const;
