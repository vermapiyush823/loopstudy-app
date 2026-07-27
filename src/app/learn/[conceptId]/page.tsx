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
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/components/markdown-content";
import { SubmitButton } from "@/components/submit-button";
import { LessonFlashcards } from "@/components/lesson-flashcards";
import { LessonDeepDive } from "@/components/lesson-deep-dive";
import { LessonGenerator } from "@/components/lesson-generator";
import { BottomCtaBar } from "@/components/bottom-cta-bar";
import { DrillInHeader } from "@/components/drill-in-header";

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
    <>
      <DrillInHeader
        title={concept.title}
        backHref={topic ? `/topics/${topic.slug}` : "/topics"}
      />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-7">
        <p className="mb-3.5 text-[13.5px] text-foreground-soft">{concept.summary}</p>

        {!lesson ? (
          <LessonGenerator conceptId={conceptId} />
        ) : (
          <div className="flex flex-col gap-6">
            <MarkdownContent
              content={lesson.content}
              className="text-[15px] leading-[1.65]"
            />

            <LessonDeepDive lessonId={lesson._id!.toString()} />

            {flashcards.length > 0 && (
              <section>
                <h3 className="mb-2.5 text-[13px] font-bold tracking-wide text-muted-foreground uppercase">
                  Practice · {flashcards.length} cards
                </h3>
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
              <h3 className="mb-2.5 text-[13px] font-bold tracking-wide text-muted-foreground uppercase">
                My takeaways
              </h3>
              <Card className="p-3.5">
                <form
                  action={saveTakeaway.bind(null, lesson._id!.toString())}
                  className="space-y-2.5"
                >
                  <Textarea
                    name="content"
                    rows={4}
                    defaultValue={note?.content ?? ""}
                    placeholder="Anything you want to remember in your own words…"
                  />
                  <SubmitButton variant="outline" size="sm" pendingLabel="Saving…">
                    Save
                  </SubmitButton>
                </form>
              </Card>
            </section>
          </div>
        )}
      </div>

      {lesson && (
        <BottomCtaBar>
          {concept.status === "completed" ? (
            <span className="flex flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4" />
              Completed
            </span>
          ) : (
            <form action={markConceptComplete.bind(null, conceptId)} className="w-full">
              <SubmitButton pendingLabel="Saving…" className="w-full">
                Mark as complete
              </SubmitButton>
            </form>
          )}
        </BottomCtaBar>
      )}
    </>
  );
}
