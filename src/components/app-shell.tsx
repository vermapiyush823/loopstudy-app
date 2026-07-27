"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { BottomTabBar } from "@/components/bottom-tab-bar";

const TOP_LEVEL_ROUTES = new Set(["/", "/topics", "/review", "/blog"]);

export function AppShell({
  children,
  userName,
  signedIn,
  dueCount,
  authControl,
}: {
  children: ReactNode;
  userName?: string | null;
  signedIn: boolean;
  dueCount: number;
  authControl: ReactNode;
}) {
  const pathname = usePathname();
  const isTopLevel = TOP_LEVEL_ROUTES.has(pathname);
  const showTabBar = signedIn && isTopLevel;

  return (
    <>
      {isTopLevel && (
        <SiteHeader userName={userName} signedIn={signedIn} authControl={authControl} />
      )}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      {showTabBar && <BottomTabBar dueCount={dueCount} />}
    </>
  );
}
