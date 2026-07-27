import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth-buttons";
import { getUserTopics } from "@/lib/topics/queries";
import { getProgressByTopic, getStudySuggestion } from "@/lib/learning/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function Dashboard({ userId }: { userId: string }) {
  const [suggestion, topics, progress] = await Promise.all([
    getStudySuggestion(userId),
    getUserTopics(userId),
    getProgressByTopic(userId),
  ]);

  const started = topics.filter((t) => progress.has(t._id!.toString()));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Today</h1>

      {suggestion ? (
        <Card className="mb-10 border-primary/30">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              {suggestion.reason}
            </CardDescription>
            <CardTitle className="text-xl">{suggestion.concept.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground">
              {suggestion.concept.summary}
            </p>
            <Button asChild>
              <Link href={`/learn/${suggestion.concept._id!.toString()}`}>
                {suggestion.concept.status === "in_progress" ? "Resume" : "Start"} lesson
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Pick a topic to start</CardTitle>
            <CardDescription>
              Choose something you want to learn and the AI will build you a path
              through it — concept by concept, with real-world examples and flashcards.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button asChild>
              <Link href="/topics">
                Browse topics
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {started.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">In progress</h2>
            <Link
              href="/topics"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              All topics
            </Link>
          </div>
          <div className="space-y-3">
            {started.map((topic) => {
              const p = progress.get(topic._id!.toString())!;
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              return (
                <Link key={topic._id!.toString()} href={`/topics/${topic.slug}`}>
                  <Card className="transition-colors hover:border-foreground/30">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-medium">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.completed} of {p.total} concepts
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-24 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Loopstudy</h1>
        <p className="text-lg text-muted-foreground">
          Pick a topic. The AI teaches it. You practice, and it keeps coming back
          until it sticks.
        </p>
      </div>

      <SignInButton />

      <Card className="w-full text-left">
        <CardHeader>
          <CardTitle>Learning that comes to you</CardTitle>
          <CardDescription>
            Choose what you want to learn and the AI builds a path through it —
            concept by concept, each with a written lesson, real-world examples, and
            flashcards generated for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sign in to start with a set of ready-made CS/tech topics — DSA, System
          Design, Kubernetes, Java, Angular, Agentic AI, and more. Write blog posts
          about what you learn whenever you feel like it.
        </CardContent>
      </Card>
    </div>
  );
}
