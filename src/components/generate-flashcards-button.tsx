"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GenerateFlashcardsButton({ conceptId }: { conceptId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/lesson-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Flashcard generation failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="gap-2.5 p-4">
      <p className="text-[13.5px] leading-relaxed text-foreground-soft">
        Ready to practice? Generate a set of flashcards from this lesson.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="sm" onClick={generate} disabled={loading}>
        {loading ? "Generating…" : "Generate flashcards"}
      </Button>
    </Card>
  );
}
