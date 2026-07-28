import type { Request, Response } from "express";
import { callingService } from "../../services/calls/calling.service.js";
import { asyncHandler, sendSuccess } from "../../utils/index.js";
import { HttpStatus } from "../../constants/http-status.js";

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export class CallsController {
  getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { configured: callingService.isConfigured() });
  });

  listCalls = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const calls = await callingService.listCalls(req.user!);
    sendSuccess(res, { calls });
  });

  getCall = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const call = await callingService.getCall(req.user!, paramId(req));
    sendSuccess(res, { call });
  });

  getAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const analytics = await callingService.getAnalytics(req.user!);
    sendSuccess(res, { analytics });
  });

  cancelCall = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await callingService.cancelCall(req.user!, paramId(req));
    sendSuccess(res, result);
  });

  uploadAndSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    const scheduledAtStr = req.body.scheduledAt as string;

    if (!file) {
      res.status(422).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "CSV file is required" },
      });
      return;
    }

    const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : new Date();
    if (Number.isNaN(scheduledAt.getTime())) {
      res.status(422).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid scheduledAt date" },
      });
      return;
    }

    const result = await callingService.scheduleFromCsv(req.user!, file.buffer, scheduledAt);
    sendSuccess(res, result, "Calls scheduled", HttpStatus.CREATED);
  });
}

export const callsController = new CallsController();
