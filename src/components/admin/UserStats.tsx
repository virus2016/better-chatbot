"use client";

import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Badge } from "ui/badge";
import { Users, UserCheck, UserX, Calendar } from "lucide-react";
import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "lib/utils";

interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsersThisMonth: number;
}

export function UserStats() {
  const { data, error, isLoading } = useSWR<UserStatsData>(
    "/api/admin/users/stats",
    fetcher,
  );

  const stats = useMemo(() => {
    if (!data) {
      return [
        {
          title: "Total Users",
          value: "---",
          icon: Users,
          description: "All registered users",
        },
        {
          title: "Verified Users",
          value: "---",
          icon: UserCheck,
          description: "Email verified users",
        },
        {
          title: "Unverified",
          value: "---",
          icon: UserX,
          description: "Pending verification",
        },
        {
          title: "New This Month",
          value: "---",
          icon: Calendar,
          description: "Recently joined",
        },
      ];
    }

    return [
      {
        title: "Total Users",
        value: data.totalUsers.toLocaleString(),
        icon: Users,
        description: "All registered users",
        badge: null,
      },
      {
        title: "Verified Users",
        value: data.verifiedUsers.toLocaleString(),
        icon: UserCheck,
        description: "Email verified users",
        badge:
          data.totalUsers > 0
            ? `${Math.round((data.verifiedUsers / data.totalUsers) * 100)}%`
            : "0%",
      },
      {
        title: "Unverified",
        value: (data.totalUsers - data.verifiedUsers).toLocaleString(),
        icon: UserX,
        description: "Pending verification",
        badge:
          data.totalUsers > 0
            ? `${Math.round(((data.totalUsers - data.verifiedUsers) / data.totalUsers) * 100)}%`
            : "0%",
      },
      {
        title: "New This Month",
        value: data.newUsersThisMonth.toLocaleString(),
        icon: Calendar,
        description: "Recently joined",
        badge: null,
      },
    ];
  }, [data]);

  if (error) {
    return (
      <Card className="relative hover:border-foreground/20 transition-colors bg-secondary/40">
        <CardContent className="p-6">
          <div className="text-destructive text-sm">
            Failed to load user statistics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="relative hover:border-foreground/20 transition-colors bg-secondary/40"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded h-6 w-12" />
                ) : (
                  stat.value
                )}
              </div>
              {stat.badge && !isLoading && (
                <Badge variant="secondary" className="text-xs">
                  {stat.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
