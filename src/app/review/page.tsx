import { requireSession } from "@/lib/auth/require-session";
import { getDueFlashcards } from "@/lib/review/queries";
import { ReviewSession } from "@/components/review-session";
import { DrillInHeader } from "@/components/drill-in-header";
import { Card } from "@/components/ui/card";

export default async function ReviewPage() {
  const session = await requireSession();
  const due = await getDueFlashcards(session.user!.id!);

  if (due.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4.5">
        <Card className="w-full gap-1.5 p-5 text-center">
          <h2 className="font-serif text-lg font-semibold">All caught up</h2>
          <p className="text-[13.5px] text-foreground-soft">
            No cards are due for review right now.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <DrillInHeader title="Review" backHref="/" />
      <ReviewSession
        cards={due.map((c) => ({
          id: c._id!.toString(),
          question: c.question,
          answer: c.answer,
          topicName: c.topicName,
          cardType: c.cardType,
          options: c.options,
          blankToken: c.blankToken,
        }))}
        backHref="/"
        backLabel="Back to dashboard"
      />
    </>
  );
}
