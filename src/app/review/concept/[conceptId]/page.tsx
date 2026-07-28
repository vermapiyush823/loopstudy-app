import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getConceptById } from "@/lib/learning/queries";
import { getFlashcardsForConceptReview } from "@/lib/review/queries";
import { getTopicsCollection } from "@/lib/db/collections";
import { ReviewSession } from "@/components/review-session";
import { DrillInHeader } from "@/components/drill-in-header";
import { Card } from "@/components/ui/card";

export default async function ConceptReviewPage({
  params,
}: {
  params: Promise<{ conceptId: string }>;
}) {
  const { conceptId } = await params;
  const session = await requireSession();
  const userId = session.user!.id!;

  const concept = await getConceptById(userId, conceptId);
  if (!concept) notFound();

  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: concept.topicId, userId: concept.userId });
  const backHref = `/learn/${conceptId}`;

  const cards = await getFlashcardsForConceptReview(userId, concept._id!);

  if (cards.length === 0) {
    return (
      <>
        <DrillInHeader title={`Review — ${concept.title}`} backHref={backHref} />
        <div className="flex flex-1 items-center justify-center px-4.5">
          <Card className="w-full gap-1.5 p-5 text-center">
            <h2 className="font-serif text-lg font-semibold">No cards yet</h2>
            <p className="text-[13.5px] text-foreground-soft">
              Generate flashcards for this lesson first.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DrillInHeader title={`Review — ${concept.title}`} backHref={backHref} />
      <ReviewSession
        cards={cards.map((c) => ({
          id: c._id!.toString(),
          question: c.question,
          answer: c.answer,
          topicName: topic?.name,
          conceptId: c.conceptId?.toString(),
          options: c.options,
        }))}
        backHref={backHref}
        backLabel={`Back to ${concept.title}`}
        conceptMasteryScore={concept.masteryScore}
      />
    </>
  );
}
