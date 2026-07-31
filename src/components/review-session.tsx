"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { rateFlashcard } from "@/lib/review/actions";
import { Button } from "@/components/ui/button";
import { BottomCtaBar } from "@/components/bottom-cta-bar";

export interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  topicName?: string;
  conceptId?: string;
  /** Optional: legacy cards created before options were required won't have this. */
  options?: string[];
  /** True once this card has racked up enough consecutive lapses to flag as struggling. */
  isLeech?: boolean;
}

interface SessionResult {
  rating: 1 | 2 | 3 | 4;
  wasCorrect: boolean;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  conceptMasteryScore,
}: {
  cards: ReviewCard[];
  backHref: string;
  backLabel: string;
  /** Pass when this session drills a single concept, so the completion screen can call out its updated score. */
  conceptMasteryScore?: number;
}) {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const currentCard = index < cards.length ? cards[index] : undefined;
  const choices = useMemo(
    () =>
      currentCard
        ? shuffled([...(currentCard.options ?? []), currentCard.answer])
        : [],
    [currentCard]
  );
  const wasCorrect = selectedOption !== null && currentCard ? selectedOption === currentCard.answer : null;

  if (!currentCard) {
    const correctCount = results.filter((r) => r.wasCorrect).length;
    const isSingleConcept = cards.length > 0 && cards.every((c) => c.conceptId === cards[0].conceptId);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <CheckCircle2 className="size-11 text-success" />
        <p className="font-serif text-lg font-semibold">Review complete</p>
        <p className="text-sm text-foreground-soft">
          {correctCount} of {results.length} correct this session.
        </p>

        <div className="mt-1 grid grid-cols-4 gap-2 text-center">
          {RATINGS.map((r) => {
            const count = results.filter((res) => res.rating === r.value).length;
            return (
              <div key={r.value} className="rounded-lg border border-border bg-card px-2 py-2">
                <div className="text-base font-semibold tabular-nums">{count}</div>
                <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {r.label}
                </div>
              </div>
            );
          })}
        </div>

        {isSingleConcept && conceptMasteryScore !== undefined && (
          <p className="text-sm font-semibold text-primary">
            Concept mastery: {conceptMasteryScore}%
          </p>
        )}

        <Button asChild className="mt-2">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    );
  }

  const card = currentCard;

  function selectOption(option: string) {
    if (selectedOption) return;
    setSelectedOption(option);
  }

  function rate(value: 1 | 2 | 3 | 4) {
    if (wasCorrect === null) return;
    startTransition(async () => {
      await rateFlashcard(card.id, value, wasCorrect);
      setResults((prev) => [...prev, { rating: value, wasCorrect }]);
      setSelectedOption(null);
      setIndex((i) => i + 1);
    });
  }

  const availableRatings = RATINGS.filter((r) =>
    wasCorrect === null ? true : wasCorrect ? r.value !== 1 : r.value === 1
  );

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

        <div className="mt-4 mb-4 flex flex-1 flex-col justify-center gap-2.5">
          {card.isLeech && (
            <div className="mx-auto mb-1 flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive">
              <TriangleAlert className="size-3" />
              Struggling card
            </div>
          )}
          <p className="mb-1 text-center font-serif text-[17px] font-semibold leading-snug">
            {card.question}
          </p>
          {choices.map((option) => {
            const isCorrect = option === card.answer;
            const isSelected = option === selectedOption;
            const showState = selectedOption !== null;
            return (
              <button
                key={option}
                disabled={showState}
                onClick={() => selectOption(option)}
                className={`rounded-xl border p-3.5 text-left text-[14.5px] font-medium transition-transform active:scale-[0.98] disabled:opacity-100 ${
                  showState && isCorrect
                    ? "border-transparent bg-success/15 text-success"
                    : showState && isSelected
                      ? "border-transparent bg-destructive/15 text-destructive"
                      : "border-border bg-card"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <BottomCtaBar className="flex-col items-stretch">
        {selectedOption !== null && (
          <>
            <p className="mb-1.5 text-center text-[11.5px] text-muted-foreground">
              {wasCorrect
                ? "Correct — rate how easy that recall was"
                : "Not quite — this card comes back again shortly"}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {availableRatings.map((r) => (
                <button
                  key={r.value}
                  disabled={isPending}
                  onClick={() => rate(r.value)}
                  className={`min-h-13 rounded-xl px-2 py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 ${r.className}`}
                >
                  {r.label}
                  <small className="mt-0.5 block text-[11px] font-normal opacity-75">
                    {r.eta}
                  </small>
                </button>
              ))}
            </div>
          </>
        )}
      </BottomCtaBar>
    </>
  );
}
