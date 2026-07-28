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

export interface DashboardStatsResponse {
  stats: DashboardStats;
}

export interface DashboardActivityResponse {
  activity: RecentActivityItem[];
}
