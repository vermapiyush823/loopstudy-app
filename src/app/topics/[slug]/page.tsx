import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { requireSession } from "@/lib/auth/require-session";
import { getTopicBySlug } from "@/lib/topics/queries";
import { getConceptsForTopic } from "@/lib/learning/queries";
import { generatePathForTopic } from "@/lib/learning/actions";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { BottomCtaBar } from "@/components/bottom-cta-bar";
import { DrillInHeader } from "@/components/drill-in-header";
import type { Concept } from "@/lib/db/collections";

function StatusDot({ status }: { status: Concept["status"] }) {
  if (status === "completed") {
    return (
      <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <span className="size-2 rounded-full bg-primary" />
      </span>
    );
  }
  return <span className="mt-0.5 size-[22px] shrink-0 rounded-full border-2 border-border" />;
}

function ConceptRow({ concept }: { concept: Concept }) {
  return (
    <Link
      href={`/learn/${concept._id!.toString()}`}
      className="flex items-start gap-3 py-3.5"
    >
      <StatusDot status={concept.status} />
      <div>
        <div className="text-[14.5px] font-semibold">{concept.title}</div>
        <div className="mt-0.5 text-[13px] leading-snug text-foreground-soft">
          {concept.summary}
        </div>
      </div>
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
    <>
      <DrillInHeader title={topic.name} backHref="/topics" />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-5">
        {concepts.length > 0 && (
          <p className="mb-3 text-[13.5px] text-foreground-soft">
            {completed} of {concepts.length} concepts complete
          </p>
        )}

        {concepts.length === 0 ? (
          <Card className="gap-3 p-5">
            <h2 className="font-serif text-lg font-semibold">No learning path yet</h2>
            <p className="text-[13.5px] leading-relaxed text-foreground-soft">
              Let the AI break {topic.name} into an ordered set of concepts, from
              fundamentals up. You&apos;ll work through them one lesson at a time.
            </p>
            <form action={generatePath}>
              <SubmitButton pendingLabel="Designing your path…" className="w-full">
                Generate learning path
              </SubmitButton>
            </form>
          </Card>
        ) : (
          <Card className="gap-0 divide-y divide-border p-0 px-4">
            <CardContent className="p-0">
              {concepts.map((concept) => (
                <ConceptRow key={concept._id!.toString()} concept={concept} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {concepts.length > 0 && (
        <BottomCtaBar>
          <span className="flex-1 text-[11.5px] leading-snug text-muted-foreground">
            Regenerating replaces concepts you haven&apos;t completed yet.
          </span>
          <form action={generatePath}>
            <SubmitButton variant="outline" size="sm" pendingLabel="Regenerating…">
              Regenerate
            </SubmitButton>
          </form>
        </BottomCtaBar>
      )}
    </>
  );
}
