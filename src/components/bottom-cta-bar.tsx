import type { ReactNode } from "react";

export function BottomCtaBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2.5 border-t border-border bg-background-soft px-4 py-3 ${className}`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}
