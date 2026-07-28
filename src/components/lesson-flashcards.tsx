"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

interface PracticeCard {
  id: string;
  question: string;
  answer: string;
  /** Optional: legacy cards created before options were required won't have this. */
  options?: string[];
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function LessonFlashcards({ cards }: { cards: PracticeCard[] }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const choicesByCard = useMemo(
    () =>
      Object.fromEntries(cards.map((c) => [c.id, shuffled([...(c.options ?? []), c.answer])])),
    [cards]
  );

  function selectOption(id: string, option: string) {
    if (selected[id]) return;
    setSelected((prev) => ({ ...prev, [id]: option }));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((card) => {
        const picked = selected[card.id];
        return (
          <Card key={card.id} className="p-3.5 text-[13.5px]">
            <p className="mb-2 font-semibold">{card.question}</p>
            <div className="flex flex-col gap-1.5">
              {choicesByCard[card.id].map((option) => {
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
      })}
    </div>
  );
}
