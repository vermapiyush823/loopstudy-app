import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getTopicBySlug } from "@/lib/topics/queries";
import { getDueFlashcardsForTopic } from "@/lib/review/queries";
import { ReviewSession } from "@/components/review-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>All caught up on {topic.name}</CardTitle>
            <CardDescription>No cards are due for this topic right now.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <h1 className="mx-auto mb-8 max-w-lg text-2xl font-semibold tracking-tight">
        Review — {topic.name}
      </h1>
      <ReviewSession
        cards={due.map((c) => ({
          id: c._id!.toString(),
          question: c.question,
          answer: c.answer,
        }))}
        backHref={`/topics/${topic.slug}`}
        backLabel={`Back to ${topic.name}`}
      />
    </div>
  );
}
