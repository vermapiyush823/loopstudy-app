"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const TOP_LEVEL_TITLES: Record<string, string> = {
  "/topics": "Learn",
  "/review": "Review",
  "/blog": "Blog",
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

export function SiteHeader({
  userName,
  signedIn,
  authControl,
}: {
  userName?: string | null;
  signedIn: boolean;
  authControl: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <header
      className="flex shrink-0 items-center gap-2.5 border-b border-border bg-background-soft px-4"
      style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}
    >
      {pathname === "/" ? (
        <span className="font-serif text-lg font-bold">Loopstudy</span>
      ) : (
        <span className="text-base font-bold">{TOP_LEVEL_TITLES[pathname] ?? "Loopstudy"}</span>
      )}

      <span className="flex-1" />

      <ThemeToggle />

      {signedIn && (
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-[12.5px] font-bold text-accent-foreground">
          {initials(userName)}
        </div>
      )}

      {authControl}
    </header>
  );
}
