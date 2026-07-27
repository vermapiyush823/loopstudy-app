"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface PracticeCard {
  id: string;
  question: string;
  answer: string;
  cardType?: "flip" | "mcq" | "fill_blank";
  options?: string[];
  blankToken?: string;
}

export function LessonFlashcards({ cards }: { cards: PracticeCard[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Record<string, string>>({});

  function toggle(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectOption(id: string, option: string) {
    if (selected[id]) return;
    setSelected((prev) => ({ ...prev, [id]: option }));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((card) => {
        const cardType = card.cardType ?? "flip";
        const isRevealed = revealed.has(card.id);

        if (cardType === "mcq") {
          const picked = selected[card.id];
          const options = card.options ?? [];
          return (
            <Card key={card.id} className="p-3.5 text-[13.5px]">
              <p className="mb-2 font-semibold">{card.question}</p>
              <div className="flex flex-col gap-1.5">
                {options.map((option) => {
                  const isCorrect = option === card.answer;
                  const isPicked = option === picked;
                  return (
                    <button
                      key={option}
                      disabled={!!picked}
                      onClick={() => selectOption(card.id, option)}
                      className={`rounded-lg border px-2.5 py-2 text-left disabled:opacity-100 ${
                        picked && isCorrect
                          ? "border-transparent bg-success/15 text-success"
                          : picked && isPicked
                            ? "border-transparent bg-destructive/15 text-destructive"
                            : "border-border bg-background"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        }

        if (cardType === "fill_blank") {
          const displayQuestion = card.blankToken
            ? card.question.replace(card.blankToken, "ـــــ")
            : card.question;
          return (
            <Card
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={() => toggle(card.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(card.id);
                }
              }}
              className={`cursor-pointer p-3.5 text-[13.5px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                isRevealed ? "border-transparent bg-accent" : ""
              }`}
            >
              <p className="font-semibold">{displayQuestion}</p>
              {isRevealed ? (
                <p className="mt-1.5 text-foreground-soft">{card.blankToken ?? card.answer}</p>
              ) : (
                <p className="mt-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Tap to check
                </p>
              )}
            </Card>
          );
        }

        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => toggle(card.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(card.id);
              }
            }}
            className={`flip-card-outer relative h-26 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              isRevealed ? "flipped" : ""
            }`}
          >
            <div className="flip-card-inner">
              <Card className="flip-card-face flex items-center p-3.5 text-[13.5px] font-semibold leading-snug">
                {card.question}
              </Card>
              <Card className="flip-card-face flip-card-face-back flex items-center border-transparent bg-accent p-3.5 text-[13.5px] leading-snug text-accent-foreground">
                {card.answer}
              </Card>
            </div>
            <span className="absolute right-2.5 bottom-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {isRevealed ? "Tap to flip back" : "Tap to reveal"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
