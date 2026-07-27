import Link from "next/link";
import { Sparkles, Layers } from "lucide-react";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";
import { getUserTopics } from "@/lib/topics/queries";
import { getProgressByTopic, getStudySuggestion } from "@/lib/learning/queries";
import { getDueSummary } from "@/lib/review/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

async function Dashboard({ userId }: { userId: string }) {
  const [suggestion, topics, progress, due] = await Promise.all([
    getStudySuggestion(userId),
    getUserTopics(userId),
    getProgressByTopic(userId),
    getDueSummary(userId),
  ]);

  const started = topics.filter((t) => progress.has(t._id!.toString()));

  return (
    <div className="flex-1 overflow-y-auto px-4.5 pt-4.5 pb-7">
      <p className="text-[11.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        {todayLabel()}
      </p>
      <h1 className="mt-1 mb-3.5 font-serif text-2xl font-semibold">Today</h1>

      <div className="flex flex-col gap-3.5">
        {suggestion ? (
          <Card className="gap-2 border-border p-5">
            <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-primary">
              <Sparkles className="size-3.5" />
              {suggestion.reason}
            </div>
            <h2 className="font-serif text-[19px] font-semibold">
              {suggestion.concept.title}
            </h2>
            <p className="mb-4 text-[13.5px] leading-relaxed text-foreground-soft">
              {suggestion.concept.summary}
            </p>
            <Button asChild className="w-full">
              <Link href={`/learn/${suggestion.concept._id!.toString()}`}>
                {suggestion.concept.status === "in_progress" ? "Resume" : "Start"} lesson
              </Link>
            </Button>
          </Card>
        ) : (
          <Card className="gap-2 border-border p-5">
            <h2 className="font-serif text-[19px] font-semibold">Pick a topic to start</h2>
            <p className="mb-4 text-[13.5px] leading-relaxed text-foreground-soft">
              Choose something you want to learn and the AI will build you a path
              through it — concept by concept, with real-world examples and flashcards.
            </p>
            <Button asChild className="w-full">
              <Link href="/topics">Browse topics</Link>
            </Button>
          </Card>
        )}

        {due.totalCount > 0 && (
          <Card className="flex-row items-center justify-between gap-2.5 border-transparent bg-accent p-4">
            <div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                <Layers className="size-3.5" />
                Spaced repetition
              </div>
              <h3 className="mt-0.5 text-[15.5px] font-bold">
                {due.totalCount} card{due.totalCount === 1 ? "" : "s"} due
              </h3>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/review">Review</Link>
            </Button>
          </Card>
        )}
      </div>

      {started.length > 0 && (
        <section>
          <div className="mt-6.5 mb-3 flex items-baseline justify-between">
            <h3 className="text-[13px] font-bold tracking-wide text-muted-foreground uppercase">
              In progress
            </h3>
            <Link href="/topics" className="text-[13px] font-semibold text-primary">
              All →
            </Link>
          </div>
          <Card className="gap-0 divide-y divide-border p-0">
            {started.map((topic) => {
              const p = progress.get(topic._id!.toString())!;
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              return (
                <Link
                  key={topic._id!.toString()}
                  href={`/topics/${topic.slug}`}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {topic.name}
                  </span>
                  <span className="h-1.5 w-15 shrink-0 overflow-hidden rounded-full bg-background">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {p.completed}/{p.total}
                  </span>
                </Link>
              );
            })}
          </Card>
        </section>
      )}
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) {
    return <Dashboard userId={session.user.id} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-14">
      <div className="mx-auto flex max-w-md flex-col items-center gap-7 text-center">
        <div className="space-y-3">
          <h1 className="font-serif text-4xl font-semibold">Loopstudy</h1>
          <p className="text-[15px] text-foreground-soft">
            Pick a topic. The AI teaches it. You practice, and it keeps coming back
            until it sticks.
          </p>
        </div>

        <SignInButton />

        <Card className="w-full gap-3 p-5 text-left">
          <h2 className="font-serif text-lg font-semibold">Learning that comes to you</h2>
          <p className="text-[13.5px] leading-relaxed text-foreground-soft">
            Choose what you want to learn and the AI builds a path through it —
            concept by concept, each with a written lesson, real-world examples, and
            flashcards generated for you.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Sign in to start with a set of ready-made CS/tech topics — DSA, System
            Design, Kubernetes, Java, Angular, Agentic AI, and more. Write blog posts
            about what you learn whenever you feel like it.
          </p>
        </Card>
      </div>
    </div>
  );
}
