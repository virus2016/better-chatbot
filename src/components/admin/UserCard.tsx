"use client";

import { Card, CardContent, CardHeader } from "ui/card";
import { Badge } from "ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import {
  Mail,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { UserActions } from "./UserActions";
import type { UserEntity } from "@/lib/db/pg/schema.pg";
import { formatDistanceToNow } from "date-fns";

interface UserCardProps {
  user: UserEntity;
  onEdit?: (user: UserEntity) => void;
  onView?: (user: UserEntity) => void;
}

export function UserCard({ user, onEdit, onView }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = formatDistanceToNow(new Date(user.createdAt), {
    addSuffix: true,
  });

  return (
    <Card className="relative hover:border-foreground/20 transition-colors bg-secondary/40 group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-none">
                {user.name}
              </h3>
              {user.emailVerified ? (
                <Badge
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <UserActions user={user} onEdit={onEdit} onView={onView} />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinedDate}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>ID: {user.id.slice(0, 8)}...</span>
            </div>
          </div>

          {/* User Preferences Preview */}
          {user.preferences && Object.keys(user.preferences).length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                Preferences
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(user.preferences)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {String(value).slice(0, 10)}
                      {String(value).length > 10 ? "..." : ""}
                    </Badge>
                  ))}
                {Object.keys(user.preferences).length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{Object.keys(user.preferences).length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground pt-1">
            Last updated{" "}
            {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
