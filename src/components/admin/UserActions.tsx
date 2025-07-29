"use client";

import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import {
  Eye,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { useState, useCallback } from "react";
import { mutate } from "swr";
import type { UserEntity } from "@/lib/db/pg/schema.pg";

interface UserActionsProps {
  user: UserEntity;
  onEdit?: (user: UserEntity) => void;
  onView?: (user: UserEntity) => void;
}

export function UserActions({ user, onEdit, onView }: UserActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuspendUser = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to suspend user");
      }

      // Refresh the user list
      mutate("/api/admin/users");
    } catch (error) {
      console.error("Error suspending user:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsProcessing(false);
    }
  }, [user.id]);

  const handleActivateUser = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/activate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to activate user");
      }

      // Refresh the user list
      mutate("/api/admin/users");
    } catch (error) {
      console.error("Error activating user:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsProcessing(false);
    }
  }, [user.id]);

  const handleDeleteUser = useCallback(async () => {
    if (
      !confirm(
        `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Refresh the user list
      mutate("/api/admin/users");
    } catch (error) {
      console.error("Error deleting user:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsProcessing(false);
    }
  }, [user.id, user.name]);

  const handleSendVerificationEmail = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/send-verification`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send verification email");
      }

      // TODO: Add toast notification for success
    } catch (error) {
      console.error("Error sending verification email:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsProcessing(false);
    }
  }, [user.id]);

  return (
    <div className="flex items-center gap-1">
      {/* Quick Actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView?.(user)}
            disabled={isProcessing}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Details</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(user)}
            disabled={isProcessing}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit User</TooltipContent>
      </Tooltip>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isProcessing}
            className="h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!user.emailVerified && (
            <>
              <DropdownMenuItem onClick={handleSendVerificationEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send Verification Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* TODO: Add logic to check if user is suspended */}
          <DropdownMenuItem onClick={handleSuspendUser}>
            <UserX className="h-4 w-4 mr-2" />
            Suspend User
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleActivateUser}>
            <UserCheck className="h-4 w-4 mr-2" />
            Activate User
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDeleteUser}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
