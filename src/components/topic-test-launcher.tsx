"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReviewSession, type ReviewCard } from "@/components/review-session";

const COUNT_PRESETS = [5, 10, 20];
const DEFAULT_COUNT = 10;

export function TopicTestLauncher({
  topics,
}: {
  topics: { id: string; name: string }[];
}) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{ cards: ReviewCard[]; topicName: string } | null>(null);

  async function start() {
    if (!topicId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/topic-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, count }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Couldn't start the test");
      if (!data.cards || data.cards.length === 0) {
        throw new Error("No questions available for this topic yet");
      }
      setSession({ cards: data.cards, topicName: data.topicName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return (
      <ReviewSession
        mode="quiz"
        cards={session.cards}
        backHref="/review"
        backLabel="Back to review"
      />
    );
  }

  if (topics.length === 0) return null;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-primary">
        <ListChecks className="size-3.5" />
        Test yourself
      </div>
      <p className="text-[13.5px] leading-relaxed text-foreground-soft">
        Pick a topic and how many questions you want — we&apos;ll generate more if you ask for
        more than exist yet.
      </p>

      <div className="space-y-1">
        <Label htmlFor="test-topic" className="text-xs font-semibold text-foreground-soft">
          Topic
        </Label>
        <select
          id="test-topic"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="test-count" className="text-xs font-semibold text-foreground-soft">
          Number of questions
        </Label>
        <div className="flex gap-1.5">
          {COUNT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setCount(preset)}
              className={`h-9 flex-1 rounded-md border text-sm font-semibold transition-colors ${
                count === preset
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-input bg-transparent text-foreground"
              }`}
            >
              {preset}
            </button>
          ))}
          <Input
            id="test-count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="w-16 text-center"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={start} disabled={loading || !topicId} className="w-full">
        {loading ? "Preparing test…" : "Start test"}
      </Button>
    </Card>
  );
}
