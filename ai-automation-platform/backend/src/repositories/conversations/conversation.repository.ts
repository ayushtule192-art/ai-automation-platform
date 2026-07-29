import type { Conversation, Message, MessageRole, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export type MessageWithMeta = Message;

export class ConversationRepository {
  async findByIdForUser(id: string, userId: string): Promise<Conversation | null> {
    return prisma.conversation.findFirst({
      where: { id, userId },
    });
  }

  async listByUser(
    userId: string,
    options: { skip?: number; take?: number } = {}
  ): Promise<Conversation[]> {
    return prisma.conversation.findMany({
      where: { userId, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      skip: options.skip,
      take: options.take ?? 50,
    });
  }

  async create(
    userId: string,
    title?: string,
    agentType: string = "chat"
  ): Promise<Conversation> {
    return prisma.conversation.create({
      data: { userId, title, agentType },
    });
  }

  async updateTitle(id: string, title: string): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id },
      data: { title },
    });
  }

  async archive(id: string, userId: string): Promise<void> {
    await prisma.conversation.updateMany({
      where: { id, userId },
      data: { status: "ARCHIVED" },
    });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async addMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    toolCalls?: Prisma.InputJsonValue;
    tokenCount?: number;
  }): Promise<Message> {
    return prisma.message.create({ data });
  }

  async touchConversation(id: string): Promise<void> {
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async countMessages(conversationId: string): Promise<number> {
    return prisma.message.count({ where: { conversationId } });
  }
}

export const conversationRepository = new ConversationRepository();
