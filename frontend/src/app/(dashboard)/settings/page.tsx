"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PageHeader } from "@/components/dashboard/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Manage your preferences and account settings" />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the platform looks</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label>Theme</Label>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {["Email notifications", "Call completion alerts", "Weekly analytics report"].map(
            (item) => (
              <div key={item} className="flex items-center justify-between">
                <Label className="font-normal">{item}</Label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage integrations with external services</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            OpenAI, ElevenLabs, Deepgram, and Twilio keys are configured at the organization level.
          </p>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">Contact admin to update API credentials.</p>
        </CardContent>
      </Card>
    </div>
  );
}
