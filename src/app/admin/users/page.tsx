"use client";

import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { UserList } from "@/components/admin/UserList";
import { UserStats } from "@/components/admin/UserStats";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, view statistics, and perform administrative actions.
        </p>
      </div>

      {/* User Statistics */}
      <UserStats />

      {/* User List */}
      <Card className="relative hover:border-foreground/20 transition-colors bg-secondary/40">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserList />
        </CardContent>
      </Card>
    </div>
  );
}
