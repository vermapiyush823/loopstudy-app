import { requireSession } from "@/lib/auth/require-session";
import { getDueFlashcards } from "@/lib/review/queries";
import { ReviewSession } from "@/components/review-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function ReviewPage() {
  const session = await requireSession();
  const due = await getDueFlashcards(session.user!.id!);

  if (due.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>All caught up</CardTitle>
            <CardDescription>No cards are due for review right now.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <h1 className="mx-auto mb-8 max-w-lg text-2xl font-semibold tracking-tight">
        Review
      </h1>
      <ReviewSession
        cards={due.map((c) => ({
          id: c._id!.toString(),
          question: c.question,
          answer: c.answer,
          topicName: c.topicName,
        }))}
        backHref="/"
        backLabel="Back to dashboard"
      />
    </div>
  );
}
