"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatAgentPanel } from "@/components/chat/chat-agent-panel";
import { Skeleton } from "@/components/ui/skeleton";

function ChatAgentContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation") ?? undefined;
  return <ChatAgentPanel initialConversationId={conversationId} />;
}

export default function ChatAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      }
    >
      <ChatAgentContent />
    </Suspense>
  );
}
