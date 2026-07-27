import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import { getUserTopics, groupTopicsByParent } from "@/lib/topics/queries";
import { getProgressByTopic } from "@/lib/learning/queries";
import { createTopic } from "@/lib/topics/actions";
import { Card } from "@/components/ui/card";
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
    <div className="flex-1 overflow-y-auto px-4.5 pt-4.5 pb-7">
      <p className="mb-4.5 text-[13.5px] text-foreground-soft">
        Pick a topic and the AI will build a learning path through it.
      </p>

      <div className="flex flex-col gap-2.5">
        {grouped.map(({ topic, subtopics }) => {
          const p = progress.get(topic._id!.toString());
          return (
            <Link key={topic._id!.toString()} href={`/topics/${topic.slug}`}>
              <Card className="gap-1.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-[15.5px] font-semibold">{topic.name}</h4>
                  {p && (
                    <span className="shrink-0 rounded-full bg-background px-2.5 py-0.5 text-[11.5px] tabular-nums text-foreground-soft">
                      {p.completed}/{p.total}
                    </span>
                  )}
                </div>
                {topic.description && (
                  <p className="text-[13px] leading-relaxed text-foreground-soft">
                    {topic.description}
                  </p>
                )}
                {subtopics.length > 0 ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Subtopics: {subtopics.map((s) => s.name).join(", ")}
                  </p>
                ) : (
                  !p && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      No path yet — open to generate one
                    </p>
                  )
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-3.5 gap-3 p-4">
        <div className="text-sm font-semibold">Add a custom topic</div>
        <form action={createTopic} className="space-y-2.5">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground-soft">
              Name
            </Label>
            <Input id="name" name="name" placeholder="e.g. Rust" required />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="description"
              className="text-xs font-semibold text-foreground-soft"
            >
              Description
            </Label>
            <Input id="description" name="description" placeholder="Optional" />
          </div>
          <Button type="submit" size="sm" className="w-full">
            Create topic
          </Button>
        </form>
      </Card>
    </div>
  );
}
