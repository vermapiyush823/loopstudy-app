import { CheckCircle2 } from "lucide-react";
import { requireSession } from "@/lib/auth/require-session";
import { getDueFlashcards } from "@/lib/review/queries";
import { getUserTopics } from "@/lib/topics/queries";
import { ReviewSession } from "@/components/review-session";
import { TopicTestLauncher } from "@/components/topic-test-launcher";
import { ReviewPageTabs } from "@/components/review-page-tabs";
import { Card } from "@/components/ui/card";

export default async function ReviewPage() {
  const session = await requireSession();
  const userId = session.user!.id!;
  const [due, topics] = await Promise.all([getDueFlashcards(userId), getUserTopics(userId)]);

  const testContent = (
    <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-7">
      <TopicTestLauncher topics={topics.map((t) => ({ id: t._id!.toString(), name: t.name }))} />
    </div>
  );

  const reviewContent =
    due.length === 0 ? (
      <div className="flex flex-1 items-center justify-center px-4.5">
        <Card className="w-full gap-1.5 p-5 text-center">
          <CheckCircle2 className="mx-auto mb-1 size-8 text-success" />
          <h2 className="font-serif text-lg font-semibold">All caught up</h2>
          <p className="text-[13.5px] text-foreground-soft">
            No cards are due for review right now.
          </p>
        </Card>
      </div>
    ) : (
      <ReviewSession
        cards={due.map((c) => ({
          id: c._id!.toString(),
          question: c.question,
          answer: c.answer,
          topicName: c.topicName,
          conceptId: c.conceptId?.toString(),
          options: c.options,
          isLeech: c.isLeech,
        }))}
        backHref="/"
        backLabel="Back to dashboard"
      />
    );

  return <ReviewPageTabs reviewContent={reviewContent} testContent={testContent} />;
}
