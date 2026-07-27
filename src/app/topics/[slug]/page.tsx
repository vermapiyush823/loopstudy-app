import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { requireSession } from "@/lib/auth/require-session";
import { getTopicBySlug } from "@/lib/topics/queries";
import { getConceptsForTopic } from "@/lib/learning/queries";
import { generatePathForTopic } from "@/lib/learning/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import type { Concept } from "@/lib/db/collections";

const STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: CircleDot,
  not_started: Circle,
} as const;

const STATUS_STYLE = {
  completed: "text-emerald-600 dark:text-emerald-500",
  in_progress: "text-primary",
  not_started: "text-muted-foreground/50",
} as const;

function ConceptRow({ concept }: { concept: Concept }) {
  const Icon = STATUS_ICON[concept.status];

  return (
    <Link href={`/learn/${concept._id!.toString()}`}>
      <Card className="transition-colors hover:border-foreground/30">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-start gap-3 text-base font-medium">
            <Icon className={`mt-0.5 size-4 shrink-0 ${STATUS_STYLE[concept.status]}`} />
            <span>{concept.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 pl-13 text-sm text-muted-foreground">
          {concept.summary}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireSession();
  const topic = await getTopicBySlug(session.user.id, slug);
  if (!topic) notFound();

  const concepts = await getConceptsForTopic(session.user.id, topic._id!);
  const completed = concepts.filter((c) => c.status === "completed").length;
  const generatePath = generatePathForTopic.bind(null, topic._id!.toString());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
        {topic.description && (
          <p className="mt-1 text-muted-foreground">{topic.description}</p>
        )}
        {concepts.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {completed} of {concepts.length} concepts complete
          </p>
        )}
      </div>

      {concepts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No learning path yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground">
              Let the AI break {topic.name} into an ordered set of concepts, from
              fundamentals up. You&apos;ll work through them one lesson at a time.
            </p>
            <form action={generatePath}>
              <SubmitButton pendingLabel="Designing your path…">
                Generate learning path
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {concepts.map((concept) => (
              <ConceptRow key={concept._id!.toString()} concept={concept} />
            ))}
          </div>

          <form action={generatePath} className="mt-8">
            <SubmitButton variant="outline" size="sm" pendingLabel="Regenerating…">
              Regenerate path
            </SubmitButton>
            <p className="mt-2 text-xs text-muted-foreground">
              Replaces concepts you haven&apos;t completed yet. Completed ones stay.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
