"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-2">
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
            className="cursor-pointer transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <CardContent className="py-4 text-sm">
              <p className="font-medium">{card.question}</p>
              {isRevealed ? (
                <p className="mt-2 text-muted-foreground">{card.answer}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground/60">
                  Click to reveal
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
