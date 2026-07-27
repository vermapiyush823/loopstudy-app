"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";

type Depth = "eli5" | "expert";

interface QAPair {
  question: string;
  answer: string;
}

export function LessonDeepDive({
  lessonId,
  initialQuestions = [],
}: {
  lessonId: string;
  initialQuestions?: QAPair[];
}) {
  const [loading, setLoading] = useState<Depth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ depth: Depth; text: string } | null>(null);

  const [questions, setQuestions] = useState<QAPair[]>(initialQuestions);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

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

  async function askQuestion() {
    const question = draft.trim();
    if (!question) return;
    setAsking(true);
    setAskError(null);
    try {
      const res = await fetch("/api/ai/lesson-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setQuestions((prev) => [...prev, { question, answer: data.answer }]);
      setDraft("");
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAsking(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-dashed border-border p-4">
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
      </div>

      <div className="rounded-2xl border border-dashed border-border p-4">
        <p className="mb-2.5 text-[12.5px] text-muted-foreground">
          Have a specific question about this lesson?
        </p>

        {questions.length > 0 && (
          <div className="mb-3 flex flex-col gap-3">
            {questions.map((qa, i) => (
              <div key={i} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <p className="text-[13.5px] font-semibold">{qa.question}</p>
                <div className="mt-1.5">
                  <MarkdownContent content={qa.answer} className="text-[13.5px]" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a follow-up…"
            disabled={asking}
          />
          <Button
            size="sm"
            className="self-end"
            onClick={askQuestion}
            disabled={asking || !draft.trim()}
          >
            {asking ? "Asking…" : "Ask"}
          </Button>
        </div>

        {askError && <p className="mt-2 text-sm text-destructive">{askError}</p>}
      </div>
    </section>
  );
}
