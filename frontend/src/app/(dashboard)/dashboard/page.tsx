"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Bot,
  MessageSquare,
  Phone,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardActivity, getDashboardStats } from "@/lib/dashboard-api";

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: getDashboardActivity,
  });

  const stats = statsData?.stats;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your AI automation platform"
      >
        <Button asChild>
          <Link href="/chat-agent">
            <Sparkles className="mr-2 h-4 w-4" />
            New Agent Session
          </Link>
        </Button>
      </PageHeader>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Conversations"
              value={stats?.totalConversations ?? 0}
              description={`${stats?.conversationsThisMonth ?? 0} this month`}
              icon={MessageSquare}
            />
            <StatCard
              title="Calls"
              value={stats?.totalCalls ?? 0}
              description={`${stats?.callsThisMonth ?? 0} this month`}
              icon={Phone}
            />
            <StatCard
              title="Customers"
              value={stats?.totalCustomers ?? 0}
              icon={Users}
            />
            <StatCard
              title="AI Tokens Used"
              value={stats?.aiTokensUsed?.toLocaleString() ?? "0"}
              icon={Zap}
              trend={{ value: "Tracked across all agents", positive: true }}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Launch your AI agents</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/voice-agent", label: "Voice Agent", icon: Bot },
              { href: "/calling-agent", label: "Calling Agent", icon: Phone },
              { href: "/chat-agent", label: "Chat Agent", icon: MessageSquare },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <action.icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium text-center">{action.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Orders summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders
            </CardTitle>
            <CardDescription>Subscription and service orders</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats?.totalOrders ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total orders</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{stats?.activeOrders ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/orders">View all orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest calls, conversations, and orders</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activityData?.activity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity yet. Start a conversation or schedule a call.
            </p>
          ) : (
            <ul className="space-y-3">
              {activityData?.activity.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.type} · {item.status.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
