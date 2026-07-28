"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Profile" description="Your account information" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {user?.firstName} {user?.lastName}
              </CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <Badge className="mt-2" variant="secondary">
                {user?.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input defaultValue={user?.firstName} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input defaultValue={user?.lastName} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Member since</Label>
            <Input
              defaultValue={
                user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""
              }
              readOnly
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
