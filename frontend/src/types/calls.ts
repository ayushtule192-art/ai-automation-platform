export type CallStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface CallRecord {
  id: string;
  phoneNumber: string;
  status: CallStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  contactName: string | null;
  createdAt: string;
}

export interface CallAnalytics {
  total: number;
  completed: number;
  failed: number;
  scheduled: number;
  inProgress: number;
  callsThisMonth: number;
  completedThisMonth: number;
  successRate: number;
  avgDurationSeconds: number;
  totalDurationSeconds: number;
}
