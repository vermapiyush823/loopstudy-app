"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { rateFlashcard } from "@/lib/review/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  topicName?: string;
}

const RATINGS: { value: 1 | 2 | 3 | 4; label: string; variant: "destructive" | "outline" | "secondary" | "default" }[] = [
  { value: 1, label: "Again", variant: "destructive" },
  { value: 2, label: "Hard", variant: "outline" },
  { value: 3, label: "Good", variant: "secondary" },
  { value: 4, label: "Easy", variant: "default" },
];

export function ReviewSession({
  cards,
  backHref,
  backLabel,
}: {
  cards: ReviewCard[];
  backHref: string;
  backLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (index >= cards.length) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <p className="text-lg font-medium">Review complete</p>
          <p className="text-sm text-muted-foreground">
            You cleared {cards.length} card{cards.length === 1 ? "" : "s"} for now.
          </p>
          <Button asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const card = cards[index];

  function reveal() {
    setRevealed(true);
  }

  function rate(value: 1 | 2 | 3 | 4) {
    startTransition(async () => {
      await rateFlashcard(card.id, value);
      setRevealed(false);
      setIndex((i) => i + 1);
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        {card.topicName && <span>{card.topicName}</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / cards.length) * 100}%` }}
        />
      </div>

      <Card
        role={revealed ? undefined : "button"}
        tabIndex={revealed ? undefined : 0}
        onClick={revealed ? undefined : reveal}
        onKeyDown={(e) => {
          if (!revealed && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            reveal();
          }
        }}
        className={!revealed ? "cursor-pointer transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" : undefined}
      >
        <CardContent className="min-h-40 py-6 text-sm">
          <p className="text-base font-medium">{card.question}</p>
          {revealed ? (
            <p className="mt-4 text-muted-foreground">{card.answer}</p>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground/60">Click to reveal</p>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <Button
              key={r.value}
              variant={r.variant}
              disabled={isPending}
              onClick={() => rate(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
