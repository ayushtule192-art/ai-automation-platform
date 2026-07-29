import { apiFetch } from "./api-client";
import type {
  DashboardActivityResponse,
  DashboardStatsResponse,
} from "@/types/dashboard";

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return apiFetch<DashboardStatsResponse>("/api/dashboard/stats");
}

export async function getDashboardActivity(): Promise<DashboardActivityResponse> {
  return apiFetch<DashboardActivityResponse>("/api/dashboard/activity");
}
