import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getConceptsCollection,
  getFlashcardsCollection,
  getLessonsCollection,
  getTopicsCollection,
} from "@/lib/db/collections";
import { generateFlashcardsFromLesson } from "@/lib/ai/prompts";
import { LlmError } from "@/lib/ai/llm";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conceptId } = (await req.json().catch(() => ({}))) as { conceptId?: string };
  if (!conceptId) {
    return NextResponse.json({ error: "conceptId is required" }, { status: 400 });
  }

  const uid = new ObjectId(session.user.id);
  const concepts = await getConceptsCollection();
  const concept = await concepts.findOne({ _id: new ObjectId(conceptId), userId: uid });
  if (!concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  const lessons = await getLessonsCollection();
  const lesson = await lessons.findOne({ userId: uid, conceptId: concept._id! });
  if (!lesson) {
    return NextResponse.json({ error: "Generate the lesson first" }, { status: 404 });
  }

  const flashcards = await getFlashcardsCollection();
  const existing = await flashcards.countDocuments({ userId: uid, lessonId: lesson._id! });
  if (existing > 0) {
    return NextResponse.json({ count: existing });
  }

  try {
    const cards = await generateFlashcardsFromLesson(lesson.content);
    if (cards.length > 0) {
      const now = new Date();
      await flashcards.insertMany(
        cards.map((card) => ({
          userId: uid,
          topicId: concept.topicId,
          conceptId: concept._id!,
          lessonId: lesson._id!,
          question: card.question,
          answer: card.answer,
          source: "ai" as const,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: now,
          lastReviewedAt: null,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    const topics = await getTopicsCollection();
    const topic = await topics.findOne({ _id: concept.topicId, userId: uid });
    revalidatePath(`/learn/${conceptId}`);
    if (topic) revalidatePath(`/topics/${topic.slug}`);

    return NextResponse.json({ count: cards.length });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Flashcard generation failed" }, { status: 500 });
  }
}
