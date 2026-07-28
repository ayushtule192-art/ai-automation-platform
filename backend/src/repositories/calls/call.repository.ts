import type { Call, CallStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export interface TranscriptTurn {
  role: "agent" | "caller";
  text: string;
  timestamp: string;
}

export interface CallMetadata {
  contactName?: string;
  email?: string;
  notes?: string;
  turns?: TranscriptTurn[];
  turnCount?: number;
}

export class CallRepository {
  async findById(id: string): Promise<Call | null> {
    return prisma.call.findUnique({ where: { id } });
  }

  async findByIdForUser(id: string, userId: string): Promise<Call | null> {
    return prisma.call.findFirst({ where: { id, userId } });
  }

  async findByTwilioSid(sid: string): Promise<Call | null> {
    return prisma.call.findUnique({ where: { twilioCallSid: sid } });
  }

  async listByUser(
    userId: string,
    options: { status?: CallStatus; skip?: number; take?: number } = {}
  ): Promise<Call[]> {
    return prisma.call.findMany({
      where: {
        userId,
        ...(options.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take ?? 50,
      include: { customer: true },
    });
  }

  async create(data: {
    userId: string;
    phoneNumber: string;
    customerId?: string;
    scheduledAt?: Date;
    metadata?: CallMetadata;
  }): Promise<Call> {
    return prisma.call.create({
      data: {
        userId: data.userId,
        phoneNumber: data.phoneNumber,
        customerId: data.customerId,
        scheduledAt: data.scheduledAt,
        status: "SCHEDULED",
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, data: Prisma.CallUpdateInput): Promise<Call> {
    return prisma.call.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: CallStatus, extra?: Prisma.CallUpdateInput): Promise<Call> {
    return prisma.call.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  async appendTranscriptTurn(id: string, turn: TranscriptTurn): Promise<void> {
    const call = await this.findById(id);
    if (!call) return;

    const metadata = (call.metadata as CallMetadata | null) ?? {};
    const turns = metadata.turns ?? [];
    turns.push(turn);

    const transcript = turns
      .map((t) => `${t.role === "agent" ? "Agent" : "Caller"}: ${t.text}`)
      .join("\n");

    await prisma.call.update({
      where: { id },
      data: {
        metadata: { ...metadata, turns, turnCount: turns.length } as unknown as Prisma.InputJsonValue,
        transcript,
      },
    });
  }

  async findDueScheduled(limit = 20): Promise<Call[]> {
    return prisma.call.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });
  }

  async getAnalytics(userId: string) {
    const [total, completed, failed, scheduled, inProgress, avgDuration] = await Promise.all([
      prisma.call.count({ where: { userId } }),
      prisma.call.count({ where: { userId, status: "COMPLETED" } }),
      prisma.call.count({ where: { userId, status: "FAILED" } }),
      prisma.call.count({ where: { userId, status: "SCHEDULED" } }),
      prisma.call.count({ where: { userId, status: "IN_PROGRESS" } }),
      prisma.call.aggregate({
        where: { userId, status: "COMPLETED", duration: { not: null } },
        _avg: { duration: true },
        _sum: { duration: true },
      }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const callsThisMonth = await prisma.call.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    });

    const completedThisMonth = await prisma.call.count({
      where: { userId, status: "COMPLETED", createdAt: { gte: startOfMonth } },
    });

    return {
      total,
      completed,
      failed,
      scheduled,
      inProgress,
      callsThisMonth,
      completedThisMonth,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgDurationSeconds: Math.round(avgDuration._avg.duration ?? 0),
      totalDurationSeconds: avgDuration._sum.duration ?? 0,
    };
  }
}

export const callRepository = new CallRepository();
