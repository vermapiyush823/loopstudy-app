"use client";

import { useEffect, useMemo, useState } from "react";
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
  wasCorrect: boolean;
}

/** How long the correct/incorrect reveal stays on screen before auto-advancing. */
const ADVANCE_DELAY_MS = 700;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ReviewSession({
  cards,
  backHref,
  backLabel,
  conceptMasteryScore,
  mode = "spaced-repetition",
}: {
  cards: ReviewCard[];
  backHref: string;
  backLabel: string;
  /** Pass when this session drills a single concept, so the completion screen can call out its updated score. */
  conceptMasteryScore?: number;
  /**
   * "spaced-repetition" (default) writes SM-2 scheduling state via rateFlashcard for every
   * answer. "quiz" is a practice-only mode (e.g. a topic self-test) that never touches
   * scheduling — it only tracks correctness for the session summary.
   */
  mode?: "spaced-repetition" | "quiz";
}) {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);

  const currentCard = index < cards.length ? cards[index] : undefined;
  const choices = useMemo(
    () =>
      currentCard
        ? shuffled([...(currentCard.options ?? []), currentCard.answer])
        : [],
    [currentCard]
  );
  const wasCorrect = selectedOption !== null && currentCard ? selectedOption === currentCard.answer : null;

  useEffect(() => {
    if (!currentCard || wasCorrect === null) return;

    if (mode === "spaced-repetition") {
      rateFlashcard(currentCard.id, wasCorrect ? 3 : 1, wasCorrect);
    }

    const timer = setTimeout(() => {
      setResults((prev) => [...prev, { wasCorrect }]);
      setSelectedOption(null);
      setIndex((i) => i + 1);
    }, ADVANCE_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasCorrect]);

  if (!currentCard) {
    const correctCount = results.filter((r) => r.wasCorrect).length;
    const isSingleConcept = cards.length > 0 && cards.every((c) => c.conceptId === cards[0].conceptId);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <CheckCircle2 className="size-11 text-success" />
        <p className="font-serif text-lg font-semibold">
          {mode === "quiz" ? "Test complete" : "Review complete"}
        </p>
        <p className="text-sm text-foreground-soft">
          {correctCount} of {results.length} correct this session.
        </p>

        {mode === "spaced-repetition" && isSingleConcept && conceptMasteryScore !== undefined && (
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
        <p className="text-center text-[11.5px] text-muted-foreground">
          {selectedOption === null
            ? "Pick an answer"
            : wasCorrect
              ? "Correct!"
              : "Not quite — moving on"}
        </p>
      </BottomCtaBar>
    </>
  );
}
