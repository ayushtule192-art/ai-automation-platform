import type { Request, Response } from "express";
import { voiceService } from "../../services/voice/voice.service.js";
import { asyncHandler, sendSuccess } from "../../utils/index.js";
import { HttpStatus } from "../../constants/http-status.js";

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? (id[0] ?? "") : (id ?? "");
}

export class VoiceController {
  getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { providers: voiceService.getProviderStatus() });
  });

  createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const session = await voiceService.createSession(req.user!);
    sendSuccess(res, { session }, "Voice session started", HttpStatus.CREATED);
  });

  getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await voiceService.getSession(req.user!, paramId(req));
    sendSuccess(res, data);
  });

  endSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await voiceService.endSession(req.user!, paramId(req));
    sendSuccess(res, result);
  });

  processTurn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
      res.status(422).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Audio file is required" },
      });
      return;
    }

    const result = await voiceService.processTurn(
      req.user!,
      paramId(req),
      file.buffer,
      file.mimetype
    );

    sendSuccess(res, { turn: result });
  });
}

export const voiceController = new VoiceController();
