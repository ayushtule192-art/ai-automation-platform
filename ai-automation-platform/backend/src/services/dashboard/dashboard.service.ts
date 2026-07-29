import { prisma } from "../../lib/prisma.js";
import type { AuthenticatedUser } from "../../types/index.js";

export interface DashboardStats {
  totalConversations: number;
  totalCalls: number;
  totalCustomers: number;
  totalOrders: number;
  activeOrders: number;
  aiTokensUsed: number;
  callsThisMonth: number;
  conversationsThisMonth: number;
}

export interface RecentActivityItem {
  id: string;
  type: "call" | "conversation" | "order";
  title: string;
  status: string;
  createdAt: string;
}

export class DashboardService {
  readonly serviceName = "DashboardService";

  async getStats(user: AuthenticatedUser): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalConversations,
      totalCalls,
      totalCustomers,
      totalOrders,
      activeOrders,
      aiUsage,
      callsThisMonth,
      conversationsThisMonth,
    ] = await Promise.all([
      prisma.conversation.count({ where: { userId: user.id } }),
      prisma.call.count({ where: { userId: user.id } }),
      prisma.customer.count({ where: { userId: user.id } }),
      prisma.order.count({ where: { userId: user.id } }),
      prisma.order.count({ where: { userId: user.id, status: "ACTIVE" } }),
      prisma.analyticsEvent.aggregate({
        where: { userId: user.id },
        _sum: { tokensUsed: true },
      }),
      prisma.call.count({
        where: { userId: user.id, createdAt: { gte: startOfMonth } },
      }),
      prisma.conversation.count({
        where: { userId: user.id, createdAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      totalConversations,
      totalCalls,
      totalCustomers,
      totalOrders,
      activeOrders,
      aiTokensUsed: aiUsage._sum.tokensUsed ?? 0,
      callsThisMonth,
      conversationsThisMonth,
    };
  }

  async getRecentActivity(user: AuthenticatedUser): Promise<RecentActivityItem[]> {
    const [calls, conversations, orders] = await Promise.all([
      prisma.call.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, phoneNumber: true, status: true, createdAt: true },
      }),
      prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, createdAt: true, service: { select: { title: true } } },
      }),
    ]);

    const activities: RecentActivityItem[] = [
      ...calls.map((call) => ({
        id: call.id,
        type: "call" as const,
        title: `Call to ${call.phoneNumber}`,
        status: call.status,
        createdAt: call.createdAt.toISOString(),
      })),
      ...conversations.map((conv) => ({
        id: conv.id,
        type: "conversation" as const,
        title: conv.title ?? "Chat conversation",
        status: conv.status,
        createdAt: conv.createdAt.toISOString(),
      })),
      ...orders.map((order) => ({
        id: order.id,
        type: "order" as const,
        title: order.service.title,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }
}

export const dashboardService = new DashboardService();
