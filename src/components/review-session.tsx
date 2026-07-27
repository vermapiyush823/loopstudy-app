"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { rateFlashcard } from "@/lib/review/actions";
import { Button } from "@/components/ui/button";
import { BottomCtaBar } from "@/components/bottom-cta-bar";

export interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  topicName?: string;
}

const RATINGS: { value: 1 | 2 | 3 | 4; label: string; eta: string; className: string }[] = [
  { value: 1, label: "Again", eta: "<1m", className: "border-transparent bg-destructive/15 text-destructive" },
  { value: 2, label: "Hard", eta: "~2d", className: "border-border bg-card" },
  { value: 3, label: "Good", eta: "~5d", className: "border-border bg-card" },
  { value: 4, label: "Easy", eta: "~9d", className: "border-transparent bg-primary text-primary-foreground" },
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <CheckCircle2 className="size-11 text-success" />
        <p className="font-serif text-lg font-semibold">Review complete</p>
        <p className="text-sm text-foreground-soft">
          You cleared {cards.length} card{cards.length === 1 ? "" : "s"} for now.
        </p>
        <Button asChild className="mt-2">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
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
    <>
      <div className="flex flex-1 flex-col overflow-y-auto px-4.5 pt-3.5 pb-4">
        <div className="mb-2 flex items-center justify-between text-[12.5px] text-foreground-soft">
          <span>
            Card {index + 1} of {cards.length}
          </span>
          {card.topicName && <span>{card.topicName}</span>}
        </div>
        <div className="h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(index / cards.length) * 100}%` }}
          />
        </div>

        <div
          role={revealed ? undefined : "button"}
          tabIndex={revealed ? undefined : 0}
          onClick={revealed ? undefined : reveal}
          onKeyDown={(e) => {
            if (!revealed && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              reveal();
            }
          }}
          className={`mt-4 mb-4 flex min-h-45 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border p-5.5 text-center shadow-card ${
            revealed
              ? "border-transparent bg-focus/15"
              : "cursor-pointer border-border bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          }`}
        >
          <p className="font-serif text-[17px] font-semibold leading-snug">
            {revealed ? card.answer : card.question}
          </p>
          <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
            {revealed ? "Rate below" : "Tap to reveal"}
          </p>
        </div>
      </div>

      <BottomCtaBar className="flex-col items-stretch">
        {revealed ? (
          <div className="grid grid-cols-2 gap-2.5">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                disabled={isPending}
                onClick={() => rate(r.value)}
                className={`min-h-13 rounded-xl px-2 py-3 text-sm font-semibold disabled:opacity-50 ${r.className}`}
              >
                {r.label}
                <small className="mt-0.5 block text-[11px] font-normal opacity-75">
                  {r.eta}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <Button className="w-full" onClick={reveal}>
            Reveal answer
          </Button>
        )}
      </BottomCtaBar>
    </>
  );
}
