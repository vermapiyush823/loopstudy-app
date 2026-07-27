"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, RotateCcw, PenLine } from "lucide-react";

const TABS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/topics", label: "Learn", icon: Layers },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/blog", label: "Blog", icon: PenLine },
] as const;

export function BottomTabBar({ dueCount = 0 }: { dueCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 border-t border-border bg-background-soft"
      style={{ height: "var(--tabbar-h)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-0.5 text-[10.5px] font-semibold ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-5" strokeWidth={1.8} />
            <span>{label}</span>
            {href === "/review" && dueCount > 0 && (
              <span className="absolute top-0 right-[calc(50%-16px)] size-1.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
