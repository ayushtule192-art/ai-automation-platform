import type { Request, Response } from "express";
import { dashboardService } from "../../services/dashboard/dashboard.service.js";
import { asyncHandler, sendSuccess } from "../../utils/index.js";

export class DashboardController {
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await dashboardService.getStats(req.user!);
    sendSuccess(res, { stats });
  });

  getRecentActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await dashboardService.getRecentActivity(req.user!);
    sendSuccess(res, { activity });
  });
}

export const dashboardController = new DashboardController();
