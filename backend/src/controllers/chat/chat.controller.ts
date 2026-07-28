import type { Request, Response } from "express";
import { chatService, writeSSE } from "../../services/chat/chat.service.js";
import { asyncHandler, sendSuccess } from "../../utils/index.js";
import { HttpStatus } from "../../constants/http-status.js";

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] ?? "" : (id ?? "");
}

export class ChatController {
  listConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const conversations = await chatService.listConversations(req.user!);
    sendSuccess(res, { conversations });
  });

  getConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await chatService.getConversation(req.user!, paramId(req));
    sendSuccess(res, data);
  });

  createConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const conversation = await chatService.createConversation(
      req.user!,
      req.body.title as string | undefined
    );
    sendSuccess(res, { conversation }, "Conversation created", HttpStatus.CREATED);
  });

  archiveConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await chatService.archiveConversation(req.user!, paramId(req));
    sendSuccess(res, result);
  });

  /** SSE streaming endpoint — POST /api/chat/conversations/:id/messages */
  streamMessage = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      return;
    }

    const conversationId = paramId(req);
    const content = (req.body as { content?: string }).content;

    if (!conversationId || !content?.trim()) {
      res.status(422).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "conversationId and content are required" },
      });
      return;
    }

    // SSE headers — disable buffering for real-time streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      await chatService.streamMessage(req.user, conversationId, content.trim(), res);
    } catch (error) {
      if (!res.headersSent) {
        throw error;
      }
      writeSSE(res, {
        event: "error",
        data: { message: error instanceof Error ? error.message : "Stream failed" },
      });
      res.end();
    }
  };
}

export const chatController = new ChatController();
