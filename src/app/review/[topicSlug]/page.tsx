import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getTopicBySlug } from "@/lib/topics/queries";
import { getDueFlashcardsForTopic } from "@/lib/review/queries";
import { ReviewSession } from "@/components/review-session";
import { DrillInHeader } from "@/components/drill-in-header";
import { Card } from "@/components/ui/card";

export default async function TopicReviewPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const session = await requireSession();
  const userId = session.user!.id!;

  const topic = await getTopicBySlug(userId, topicSlug);
  if (!topic) notFound();

  const due = await getDueFlashcardsForTopic(userId, topic._id!);

  if (due.length === 0) {
    return (
      <>
        <DrillInHeader title={`Review — ${topic.name}`} backHref={`/topics/${topic.slug}`} />
        <div className="flex flex-1 items-center justify-center px-4.5">
          <Card className="w-full gap-1.5 p-5 text-center">
            <h2 className="font-serif text-lg font-semibold">
              All caught up on {topic.name}
            </h2>
            <p className="text-[13.5px] text-foreground-soft">
              No cards are due for this topic right now.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DrillInHeader title={`Review — ${topic.name}`} backHref={`/topics/${topic.slug}`} />
      <ReviewSession
        cards={due.map((c) => ({
          id: c._id!.toString(),
          question: c.question,
          answer: c.answer,
          conceptId: c.conceptId?.toString(),
          options: c.options,
        }))}
        backHref={`/topics/${topic.slug}`}
        backLabel={`Back to ${topic.name}`}
      />
    </>
  );
}
