"use client";

import type * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "lib/utils";

function Avatar({ className, children, ...props }: any) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded",
        className,
      )}
      {...(props as any)}
    />
  );
}

function AvatarImage({ className, ...props }: any) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...(props as any)}
    />
  );
}

function AvatarFallback({ className, children, ...props }: any) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...(props as any)}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
