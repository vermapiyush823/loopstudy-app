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
import {
  generateLessonForConcept,
  markConceptComplete,
  saveTakeaway,
} from "@/lib/learning/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";
import { SubmitButton } from "@/components/submit-button";
import { LessonFlashcards } from "@/components/lesson-flashcards";
import { LessonDeepDive } from "@/components/lesson-deep-dive";

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

  const startLesson = generateLessonForConcept.bind(null, conceptId);

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
        <Card>
          <CardHeader>
            <CardTitle>Ready when you are</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <p className="text-sm text-muted-foreground">
              The AI will write this lesson for you — the explanation, real-world
              examples, and a set of flashcards to practice with. Takes a few seconds.
            </p>
            <form action={startLesson}>
              <SubmitButton pendingLabel="Writing your lesson…">
                Teach me this
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <MarkdownContent content={lesson.explanation} />

          {lesson.examples.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                In the real world
              </h2>
              <div className="space-y-3">
                {lesson.examples.map((example, i) => (
                  <Card key={i}>
                    <CardContent className="py-4 text-sm leading-relaxed">
                      <MarkdownContent content={example} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {lesson.keyTakeaways.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Worth remembering
              </h2>
              <ul className="space-y-2">
                {lesson.keyTakeaways.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
