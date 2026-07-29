"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessagesSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { listConversations } from "@/lib/chat-api";

export default function ConversationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: listConversations,
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Conversations" description="All chat agent conversation history">
        <Button asChild>
          <Link href="/chat-agent">
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Start a chat session with the Chat Agent to see conversations here."
          icon={MessagesSquare}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/chat-agent?conversation=${conv.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base line-clamp-2">{conv.title}</CardTitle>
                  <CardDescription>
                    {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground capitalize">
                    {conv.status.toLowerCase()} · {conv.agentType}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
