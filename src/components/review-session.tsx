"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { rateFlashcard } from "@/lib/review/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BottomCtaBar } from "@/components/bottom-cta-bar";

export interface ReviewCard {
  id: string;
  question: string;
  answer: string;
  topicName?: string;
  cardType?: "flip" | "mcq" | "fill_blank";
  options?: string[];
  blankToken?: string;
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
}: {
  cards: ReviewCard[];
  backHref: string;
  backLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [blankInput, setBlankInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentCard = index < cards.length ? cards[index] : undefined;
  const mcqChoices = useMemo(
    () =>
      currentCard?.cardType === "mcq"
        ? shuffled([...(currentCard.options ?? []), currentCard.answer])
        : [],
    [currentCard]
  );

  if (!currentCard) {
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

  const card = currentCard;
  const cardType = card.cardType ?? "flip";

  function reveal() {
    setRevealed(true);
  }

  function selectOption(option: string) {
    if (selectedOption) return;
    setSelectedOption(option);
    setRevealed(true);
  }

  function checkBlank() {
    setRevealed(true);
  }

  const blankCorrect =
    cardType === "fill_blank" &&
    blankInput.trim().toLowerCase() === (card.blankToken ?? card.answer).trim().toLowerCase();

  function rate(value: 1 | 2 | 3 | 4) {
    startTransition(async () => {
      await rateFlashcard(card.id, value);
      setRevealed(false);
      setSelectedOption(null);
      setBlankInput("");
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

        {cardType === "mcq" ? (
          <div className="mt-4 mb-4 flex flex-1 flex-col justify-center gap-2.5">
            <p className="mb-1 text-center font-serif text-[17px] font-semibold leading-snug">
              {card.question}
            </p>
            {mcqChoices.map((option) => {
              const isCorrect = option === card.answer;
              const isSelected = option === selectedOption;
              const showState = selectedOption !== null;
              return (
                <button
                  key={option}
                  disabled={showState}
                  onClick={() => selectOption(option)}
                  className={`rounded-xl border p-3.5 text-left text-[14.5px] font-medium disabled:opacity-100 ${
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
        ) : cardType === "fill_blank" ? (
          <div className="mt-4 mb-4 flex min-h-45 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5.5 text-center shadow-card">
            <p className="font-serif text-[17px] font-semibold leading-snug">
              {card.blankToken
                ? card.question.replace(card.blankToken, "ـــــ")
                : card.question}
            </p>
            {revealed ? (
              <p
                className={`text-sm font-semibold ${blankCorrect ? "text-success" : "text-destructive"}`}
              >
                {blankCorrect ? "Correct" : `Answer: ${card.blankToken ?? card.answer}`}
              </p>
            ) : (
              <Input
                autoFocus
                value={blankInput}
                onChange={(e) => setBlankInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") checkBlank();
                }}
                placeholder="Type the missing word…"
                className="max-w-56 text-center"
              />
            )}
          </div>
        ) : (
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
            className={`flip-card-outer mt-4 mb-4 min-h-45 flex-1 ${revealed ? "flipped" : "cursor-pointer"}`}
          >
            <div className="flip-card-inner">
              <Card
                className={`flip-card-face flex flex-col items-center justify-center gap-2 p-5.5 text-center ${
                  revealed ? "" : "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                }`}
              >
                <p className="font-serif text-[17px] font-semibold leading-snug">{card.question}</p>
                <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Tap to reveal
                </p>
              </Card>
              <Card className="flip-card-face flip-card-face-back flex flex-col items-center justify-center gap-2 border-transparent bg-focus/15 p-5.5 text-center">
                <p className="font-serif text-[17px] font-semibold leading-snug">{card.answer}</p>
                <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Rate below
                </p>
              </Card>
            </div>
          </div>
        )}
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
        ) : cardType === "fill_blank" ? (
          <Button className="w-full" onClick={checkBlank} disabled={!blankInput.trim()}>
            Check answer
          </Button>
        ) : cardType === "mcq" ? null : (
          <Button className="w-full" onClick={reveal}>
            Reveal answer
          </Button>
        )}
      </BottomCtaBar>
    </>
  );
}
