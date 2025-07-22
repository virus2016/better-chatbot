import { SidebarProvider } from "ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { cookies, headers as getHeaders } from "next/headers";

import { auth } from "auth/server";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";

export const experimental_ppr = true;

export default async function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  const [cookieStore, headers] = await Promise.all([cookies(), getHeaders()]);
  const session = await auth.api
    .getSession({
      headers,
    })
    .catch(() => null);
  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppPopupProvider />
      <AppSidebar session={session || undefined} />
      <main className="relative bg-background  w-full flex flex-col h-screen">
        <AppHeader />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
