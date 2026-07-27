"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";

type Depth = "eli5" | "expert";

export function LessonDeepDive({ lessonId }: { lessonId: string }) {
  const [loading, setLoading] = useState<Depth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ depth: Depth; text: string } | null>(null);

  async function run(depth: Depth) {
    setLoading(depth);
    setError(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, depth }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setResult({ depth, text: data.explanation });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-2xl border border-dashed border-border p-4">
      <p className="mb-2.5 text-[12.5px] text-muted-foreground">
        Didn&apos;t land? Try another angle.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => run("eli5")}
          disabled={loading !== null}
        >
          {loading === "eli5" ? "Rewriting…" : "Simpler"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => run("expert")}
          disabled={loading !== null}
        >
          {loading === "expert" ? "Rewriting…" : "Deeper"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {result && (
        <div className="mt-4 border-t border-border pt-4">
          <MarkdownContent content={result.text} />
        </div>
      )}
    </section>
  );
}
