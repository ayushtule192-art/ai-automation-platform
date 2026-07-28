"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Loader2, Phone, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  cancelCall,
  getCallsStatus,
  listCalls,
  uploadAndScheduleCalls,
} from "@/lib/calls-api";
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

function formatSchedule(iso: string | null): string {
  if (!iso) return "Immediate";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CallingAgentPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ["calls", "status"],
    queryFn: getCallsStatus,
  });

  const { data: callsData, isLoading } = useQuery({
    queryKey: ["calls", "list"],
    queryFn: listCalls,
    refetchInterval: 15_000,
  });

  const scheduleMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file selected");
      const when = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();
      return uploadAndScheduleCalls(file, when);
    },
    onSuccess: (result) => {
      setMessage({
        type: "success",
        text: `Scheduled ${result.scheduled} call${result.scheduled === 1 ? "" : "s"}`,
      });
      setFile(null);
      setScheduledAt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
    onError: (err: Error) => setMessage({ type: "error", text: err.message }),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelCall,
    onSuccess: () => {
      setMessage({ type: "success", text: "Call cancelled" });
      void queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
    onError: (err: Error) => setMessage({ type: "error", text: err.message }),
  });

  const calls = callsData?.calls ?? [];
  const scheduledCalls = calls.filter((c) => c.status === "SCHEDULED" || c.status === "IN_PROGRESS");
  const configured = statusData?.configured ?? false;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calling Agent"
        description="Upload contacts, schedule outbound calls, and review AI-generated summaries"
      >
        <Badge variant={configured ? "default" : "destructive"}>
          Twilio {configured ? "Connected" : "Not Configured"}
        </Badge>
      </PageHeader>

      {message && (
        <p
          className={`text-sm rounded-lg px-4 py-2 ${
            message.type === "success"
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV
            </CardTitle>
            <CardDescription>
              CSV columns: name, phone, email (optional), notes (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv">Contact list</Label>
              <Input
                ref={fileInputRef}
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={!configured}
              />
              {file && (
                <p className="text-sm text-muted-foreground">Loaded: {file.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule date &amp; time</Label>
              <Input
                id="schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                disabled={!configured}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to call immediately. Twilio webhooks require a public API_URL (use ngrok in dev).
              </p>
            </div>
            <Button
              className="w-full"
              disabled={!file || !configured || scheduleMutation.isPending}
              onClick={() => scheduleMutation.mutate()}
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Schedule Calls
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Queue
            </CardTitle>
            <CardDescription>Scheduled and in-progress outbound calls</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : scheduledCalls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Upload a CSV to schedule calls
              </p>
            ) : (
              <ul className="space-y-3">
                {scheduledCalls.map((call: CallRecord) => (
                  <li
                    key={call.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {call.contactName ?? call.phoneNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {call.phoneNumber} · {formatSchedule(call.scheduledAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(call.status)}>
                        {call.status.toLowerCase().replace("_", " ")}
                      </Badge>
                      {call.status === "SCHEDULED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => cancelMutation.mutate(call.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            Upload CSV → Schedule → Twilio → AI speaks → Transcript → Summary → Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Upload CSV", "Schedule", "Twilio Call", "AI Dialog", "Transcript", "Summary"].map(
              (step, i) => (
                <Badge key={step} variant={i === 0 && file ? "default" : "outline"}>
                  {step}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
