import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function DrillInHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <header
      className="flex shrink-0 items-center gap-2.5 border-b border-border bg-background-soft px-2.5"
      style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}
    >
      <Link
        href={backHref}
        aria-label="Back"
        className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-foreground"
      >
        <ChevronLeft className="size-5" strokeWidth={1.8} />
      </Link>
      <span className="truncate text-base font-bold">{title}</span>
    </header>
  );
}
