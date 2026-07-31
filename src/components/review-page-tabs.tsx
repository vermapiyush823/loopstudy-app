"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Header + tab toggle for /review: due-card review starts as the default tab
 * (the primary spaced-repetition habit loop shouldn't need an extra tap),
 * with "Test yourself" one tap away for the topic-scoped quiz mode.
 */
export function ReviewPageTabs({
  reviewContent,
  testContent,
}: {
  reviewContent: ReactNode;
  testContent: ReactNode;
}) {
  const [tab, setTab] = useState<"review" | "test">("review");

  return (
    <>
      <header
        className="flex shrink-0 items-center gap-2.5 border-b border-border bg-background-soft px-2.5"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}
      >
        <Link
          href="/"
          aria-label="Back"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full text-foreground"
        >
          <ChevronLeft className="size-5" strokeWidth={1.8} />
        </Link>
        <div className="flex flex-1 gap-1 rounded-full bg-background p-1">
          <button
            onClick={() => setTab("review")}
            className={`h-8 flex-1 rounded-full text-[13px] font-semibold transition-colors ${
              tab === "review" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
            }`}
          >
            Review
          </button>
          <button
            onClick={() => setTab("test")}
            className={`h-8 flex-1 rounded-full text-[13px] font-semibold transition-colors ${
              tab === "test" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
            }`}
          >
            Test yourself
          </button>
        </div>
      </header>
      {tab === "review" ? reviewContent : testContent}
    </>
  );
}
