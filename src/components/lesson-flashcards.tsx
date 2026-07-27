"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface PracticeCard {
  id: string;
  question: string;
  answer: string;
}

export function LessonFlashcards({ cards }: { cards: PracticeCard[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((card) => {
        const isRevealed = revealed.has(card.id);
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
            <p className="font-semibold">{card.question}</p>
            {isRevealed ? (
              <p className="mt-1.5 text-foreground-soft">{card.answer}</p>
            ) : (
              <p className="mt-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Tap to reveal
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
