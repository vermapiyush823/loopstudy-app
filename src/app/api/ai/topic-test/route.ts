import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getFlashcardsCollection, getTopicsCollection } from "@/lib/db/collections";
import { getConceptsForTopic } from "@/lib/learning/queries";
import { getAllFlashcardsForTopic } from "@/lib/review/queries";
import { generateFlashcardsForTopic } from "@/lib/ai/prompts";
import { LlmError } from "@/lib/ai/llm";

export const maxDuration = 60;

const MIN_COUNT = 1;
const MAX_COUNT = 50;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { topicId?: string; count?: number };
  const { topicId } = body;
  if (!topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  const count = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(body.count ?? MIN_COUNT)));

  const uid = new ObjectId(session.user.id);
  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: new ObjectId(topicId), userId: uid });
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const existing = await getAllFlashcardsForTopic(session.user.id, topic._id!);
  const pool = existing.map((c) => ({
    id: c._id!.toString(),
    question: c.question,
    answer: c.answer,
    options: c.options,
  }));

  const shortfall = count - existing.length;
  if (shortfall > 0) {
    const concepts = await getConceptsForTopic(session.user.id, topic._id!);
    if (concepts.length === 0) {
      return NextResponse.json(
        { error: "This topic has no learning path yet — generate one before testing yourself." },
        { status: 400 }
      );
    }

    let generated: Awaited<ReturnType<typeof generateFlashcardsForTopic>>;
    try {
      generated = await generateFlashcardsForTopic(
        topic.name,
        concepts.map((c) => ({ title: c.title, summary: c.summary })),
        shortfall
      );
    } catch (err) {
      if (err instanceof LlmError) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      return NextResponse.json({ error: "Flashcard generation failed" }, { status: 500 });
    }

    if (generated.length > 0) {
      const flashcards = await getFlashcardsCollection();
      const now = new Date();
      const insertResult = await flashcards.insertMany(
        generated.map((card) => ({
          userId: uid,
          topicId: topic._id!,
          question: card.question,
          answer: card.answer,
          source: "ai" as const,
          options: card.options,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: now,
          lastReviewedAt: null,
          createdAt: now,
          updatedAt: now,
        }))
      );

      generated.forEach((card, i) => {
        pool.push({
          id: insertResult.insertedIds[i].toString(),
          question: card.question,
          answer: card.answer,
          options: card.options,
        });
      });
    }
  }

  const cards = shuffled(pool).slice(0, count);
  return NextResponse.json({ cards, topicName: topic.name });
}
