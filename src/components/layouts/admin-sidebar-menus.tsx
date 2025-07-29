"use client";
import { SidebarMenuButton, useSidebar } from "ui/sidebar";
import { Tooltip } from "ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroupContent } from "ui/sidebar";

import { SidebarGroup } from "ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  BarChart3,
  Users,
  Settings,
  Shield,
  Database,
  Activity,
} from "lucide-react";

export function AdminSidebarMenus() {
  const router = useRouter();

  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem className="mb-1">
              <Link
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenMobile(false);
                  router.push(`/admin`);
                }}
              >
                <SidebarMenuButton className="flex font-semibold group/dashboard bg-input/20 border border-border/40">
                  <BarChart3 className="size-4" />
                  Dashboard Overview
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/admin/users">
                <SidebarMenuButton className="font-semibold">
                  <Users className="size-4" />
                  User Management
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/admin/analytics">
                <SidebarMenuButton className="font-semibold">
                  <Activity className="size-4" />
                  Usage Analytics
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/admin/system">
                <SidebarMenuButton className="font-semibold">
                  <Database className="size-4" />
                  System Settings
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
        <SidebarMenu>
          <Tooltip>
            <SidebarMenuItem>
              <Link href="/admin/security">
                <SidebarMenuButton className="font-semibold">
                  <Shield className="size-4" />
                  Security
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </Tooltip>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
