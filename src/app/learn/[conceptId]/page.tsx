import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireSession } from "@/lib/auth/require-session";
import {
  getConceptById,
  getFlashcardsForLesson,
  getLessonForConcept,
  getLessonNote,
} from "@/lib/learning/queries";
import { getTopicsCollection } from "@/lib/db/collections";
import { markConceptComplete, saveTakeaway } from "@/lib/learning/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";
import { SubmitButton } from "@/components/submit-button";
import { LessonFlashcards } from "@/components/lesson-flashcards";
import { LessonDeepDive } from "@/components/lesson-deep-dive";
import { LessonGenerator } from "@/components/lesson-generator";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ conceptId: string }>;
}) {
  const { conceptId } = await params;
  const session = await requireSession();

  const concept = await getConceptById(session.user.id, conceptId);
  if (!concept) notFound();

  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: concept.topicId });

  const lesson = await getLessonForConcept(session.user.id, concept._id!);
  const [note, flashcards] = lesson
    ? await Promise.all([
        getLessonNote(session.user.id, lesson._id!),
        getFlashcardsForLesson(session.user.id, lesson._id!),
      ])
    : [null, []];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        {topic && (
          <Link
            href={`/topics/${topic.slug}`}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            ← {topic.name}
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{concept.title}</h1>
        <p className="mt-1 text-muted-foreground">{concept.summary}</p>
      </div>

      {!lesson ? (
        <LessonGenerator conceptId={conceptId} />
      ) : (
        <div className="space-y-8">
          <MarkdownContent content={lesson.content} />

          <LessonDeepDive lessonId={lesson._id!.toString()} />

          {flashcards.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Practice ({flashcards.length} cards)
              </h2>
              <LessonFlashcards
                cards={flashcards.map((c) => ({
                  id: c._id!.toString(),
                  question: c.question,
                  answer: c.answer,
                }))}
              />
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">My takeaways</h2>
            <form action={saveTakeaway.bind(null, lesson._id!.toString())} className="space-y-3">
              <Textarea
                name="content"
                rows={5}
                defaultValue={note?.content ?? ""}
                placeholder="Anything you want to remember in your own words — what clicked, what didn't, what to revisit."
              />
              <SubmitButton variant="outline" size="sm" pendingLabel="Saving…">
                Save takeaways
              </SubmitButton>
            </form>
          </section>

          <div className="flex items-center gap-3 border-t pt-6">
            {concept.status === "completed" ? (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500">
                <CheckCircle2 className="size-4" />
                Completed
              </p>
            ) : (
              <form action={markConceptComplete.bind(null, conceptId)}>
                <SubmitButton pendingLabel="Saving…">Mark as complete</SubmitButton>
              </form>
            )}
            {topic && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/topics/${topic.slug}`}>Back to path</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
