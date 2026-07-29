"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, MessageSquare, Phone, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardStats } from "@/lib/dashboard-api";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="AI usage, conversation metrics, and performance insights"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Total Calls" value={stats?.totalCalls ?? 0} icon={Phone} />
            <StatCard
              title="Conversations"
              value={stats?.totalConversations ?? 0}
              icon={MessageSquare}
            />
            <StatCard title="AI Tokens" value={stats?.aiTokensUsed?.toLocaleString() ?? 0} icon={Zap} />
            <StatCard title="Customers" value={stats?.totalCustomers ?? 0} icon={BarChart3} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>Calls and conversations this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Calls this month</span>
              <span className="text-2xl font-bold">{stats?.callsThisMonth ?? 0}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((stats?.callsThisMonth ?? 0) * 10, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conversations this month</span>
              <span className="text-2xl font-bold">{stats?.conversationsThisMonth ?? 0}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min((stats?.conversationsThisMonth ?? 0) * 10, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription>Token consumption across all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats?.aiTokensUsed?.toLocaleString() ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-2">Total tokens consumed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
