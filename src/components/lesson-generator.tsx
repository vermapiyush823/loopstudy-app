"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";

type Phase = "idle" | "connecting" | "streaming" | "done" | "error";

async function* readNdjson(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      yield JSON.parse(line) as { chunk?: string; error?: string };
    }
  }
}

export function LessonGenerator({ conceptId }: { conceptId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function start() {
    setPhase("connecting");
    setError(null);
    setText("");

    try {
      const res = await fetch("/api/ai/lesson-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Request failed");
      }

      let streamError: string | null = null;
      for await (const frame of readNdjson(res.body)) {
        if (frame.error) {
          streamError = frame.error;
          break;
        }
        if (frame.chunk) {
          setPhase((p) => (p === "connecting" ? "streaming" : p));
          setText((prev) => prev + frame.chunk);
        }
      }

      if (streamError) {
        setError(streamError);
        setPhase("error");
        return;
      }

      setPhase("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  if (phase === "idle" || phase === "error") {
    return (
      <Card className="gap-3 p-5">
        <h2 className="font-serif text-lg font-semibold">Ready when you are</h2>
        <p className="text-[13.5px] leading-relaxed text-foreground-soft">
          The AI will write this lesson for you — the explanation, real-world
          examples, and key takeaways. You can generate flashcards afterward.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={start} className="w-full">
          {error ? "Try again" : "Teach me this"}
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {phase === "connecting" && (
        <p className="text-sm text-muted-foreground">Connecting to the AI…</p>
      )}
      {text && <MarkdownContent content={text} className="text-[15px] leading-[1.65]" />}
    </div>
  );
}
