import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import { getUserTopics, groupTopicsByParent } from "@/lib/topics/queries";
import { getProgressByTopic } from "@/lib/learning/queries";
import { createTopic } from "@/lib/topics/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function TopicsPage() {
  const session = await requireSession();
  const [topics, progress] = await Promise.all([
    getUserTopics(session.user.id),
    getProgressByTopic(session.user.id),
  ]);
  const grouped = groupTopicsByParent(topics);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">What do you want to learn?</h1>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Pick a topic and the AI will build a learning path through it.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grouped.map(({ topic, subtopics }) => {
          const p = progress.get(topic._id!.toString());
          return (
            <Link key={topic._id!.toString()} href={`/topics/${topic.slug}`}>
              <Card className="h-full transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{topic.name}</span>
                    {p && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {p.completed}/{p.total}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {topic.description && <p>{topic.description}</p>}
                  {subtopics.length > 0 && (
                    <p className="text-xs">
                      Subtopics: {subtopics.map((s) => s.name).join(", ")}
                    </p>
                  )}
                  {!p && (
                    <p className="text-xs text-muted-foreground/70">
                      No path yet — open to generate one
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-8 max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Add a custom topic</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTopic} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. GraphQL" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" name="description" placeholder="Short description" />
            </div>
            <Button type="submit">Create topic</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
