"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clock, PhoneCall, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { getCallAnalytics, listCalls } from "@/lib/calls-api";
import type { CallRecord, CallStatus } from "@/types/calls";

function statusVariant(status: CallStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "FAILED":
      return "destructive";
    case "IN_PROGRESS":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallLogsPage() {
  const { data: callsData, isLoading } = useQuery({
    queryKey: ["calls", "list"],
    queryFn: listCalls,
    refetchInterval: 30_000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["calls", "analytics"],
    queryFn: getCallAnalytics,
  });

  const calls = callsData?.calls ?? [];
  const analytics = analyticsData?.analytics;

  return (
    <div className="space-y-6">
      <PageHeader title="Call Logs" description="History of all outbound AI calls">
        <Button asChild>
          <Link href="/calling-agent">Schedule Calls</Link>
        </Button>
      </PageHeader>

      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Calls</CardDescription>
              <CardTitle className="text-2xl">{analytics.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-2xl">{analytics.successRate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Duration</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                {formatDuration(analytics.avgDurationSeconds)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-2xl">{analytics.callsThisMonth}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : calls.length === 0 ? (
        <EmptyState
          title="No call logs yet"
          description="Calls made through the Calling Agent will appear here with transcripts and summaries."
          icon={PhoneCall}
        />
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {calls.map((call: CallRecord) => (
            <AccordionItem key={call.id} value={call.id} className="border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 items-center justify-between gap-4 pr-4 text-left">
                  <div>
                    <p className="font-medium">
                      {call.contactName ?? call.phoneNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">{call.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="hidden sm:flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {call.endedAt
                        ? new Date(call.endedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : call.scheduledAt
                          ? `Scheduled ${new Date(call.scheduledAt).toLocaleString()}`
                          : "—"}
                    </span>
                    <span className="hidden md:inline">{formatDuration(call.duration)}</span>
                    <Badge variant={statusVariant(call.status)}>
                      {call.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {call.summary && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Summary</h4>
                    <p className="text-sm text-muted-foreground">{call.summary}</p>
                  </div>
                )}
                {call.transcript && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Transcript</h4>
                    <pre className="text-sm whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans">
                      {call.transcript}
                    </pre>
                  </div>
                )}
                {call.recordingUrl && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Recording</h4>
                    <audio controls src={call.recordingUrl} className="w-full max-w-md" />
                  </div>
                )}
                {!call.summary && !call.transcript && (
                  <p className="text-sm text-muted-foreground">
                    No transcript available for this call yet.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
