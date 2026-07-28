import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000),
});

export const conversationIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
