"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getConceptsCollection,
  getFlashcardsCollection,
  getLessonNotesCollection,
  getLessonQuestionsCollection,
  getLessonsCollection,
  getTopicsCollection,
} from "@/lib/db/collections";
import { generateLearningPath } from "@/lib/ai/prompts";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

/** Generates (or regenerates) the ordered concept path for a topic. */
export async function generatePathForTopic(topicId: string) {
  const userId = await requireUserId();
  const uid = new ObjectId(userId);

  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: new ObjectId(topicId), userId: uid });
  if (!topic) throw new Error("Forbidden: topic does not belong to user");

  const generated = await generateLearningPath(topic.name, topic.description);
  if (generated.length === 0) throw new Error("The AI returned an empty learning path");

  const concepts = await getConceptsCollection();
  const now = new Date();

  // Regenerating replaces the path, but keeps concepts the user already completed.
  const existing = await concepts
    .find({ userId: uid, topicId: topic._id! })
    .toArray();
  const completedTitles = new Set(
    existing.filter((c) => c.status === "completed").map((c) => c.title.toLowerCase())
  );

  await concepts.deleteMany({ userId: uid, topicId: topic._id!, status: { $ne: "completed" } });

  const startOrder = existing.filter((c) => c.status === "completed").length;
  const docs = generated
    .filter((c) => !completedTitles.has(c.title.toLowerCase()))
    .map((c, i) => ({
      userId: uid,
      topicId: topic._id!,
      order: startOrder + i,
      title: c.title,
      summary: c.summary,
      status: "not_started" as const,
      createdAt: now,
      updatedAt: now,
    }));

  if (docs.length > 0) await concepts.insertMany(docs);

  revalidatePath(`/topics/${topic.slug}`);
  revalidatePath("/");
}

export async function markConceptComplete(conceptId: string) {
  const userId = await requireUserId();
  const uid = new ObjectId(userId);

  const concepts = await getConceptsCollection();
  const concept = await concepts.findOne({ _id: new ObjectId(conceptId), userId: uid });
  if (!concept) throw new Error("Forbidden: concept does not belong to user");

  await concepts.updateOne(
    { _id: concept._id },
    { $set: { status: "completed", updatedAt: new Date() } }
  );

  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: concept.topicId, userId: uid });

  revalidatePath(`/learn/${conceptId}`);
  if (topic) revalidatePath(`/topics/${topic.slug}`);
  revalidatePath("/");
}

/**
 * Deletes the existing lesson for a concept (plus its flashcards, note, and
 * Q&A — all keyed to the lesson content that's about to be replaced), then
 * resets the concept back to not_started so LessonGenerator regenerates it
 * from scratch on the client's next request.
 */
export async function regenerateLesson(conceptId: string) {
  const userId = await requireUserId();
  const uid = new ObjectId(userId);

  const concepts = await getConceptsCollection();
  const concept = await concepts.findOne({ _id: new ObjectId(conceptId), userId: uid });
  if (!concept) throw new Error("Forbidden: concept does not belong to user");

  const lessons = await getLessonsCollection();
  const lesson = await lessons.findOne({ userId: uid, conceptId: concept._id! });
  if (!lesson) return;

  const [flashcards, notes, questions] = await Promise.all([
    getFlashcardsCollection(),
    getLessonNotesCollection(),
    getLessonQuestionsCollection(),
  ]);

  await Promise.all([
    flashcards.deleteMany({ userId: uid, lessonId: lesson._id! }),
    notes.deleteOne({ userId: uid, lessonId: lesson._id! }),
    questions.deleteMany({ userId: uid, lessonId: lesson._id! }),
    lessons.deleteOne({ _id: lesson._id! }),
  ]);

  await concepts.updateOne(
    { _id: concept._id },
    {
      $set: { status: "not_started", updatedAt: new Date() },
      $unset: { masteryScore: "", masteryUpdatedAt: "" },
    }
  );

  revalidatePath(`/learn/${conceptId}`);
}

export async function saveTakeaway(lessonId: string, formData: FormData) {
  const userId = await requireUserId();
  const uid = new ObjectId(userId);

  const lessons = await getLessonsCollection();
  const lesson = await lessons.findOne({ _id: new ObjectId(lessonId), userId: uid });
  if (!lesson) throw new Error("Forbidden: lesson does not belong to user");

  const content = String(formData.get("content") ?? "").trim();
  const notes = await getLessonNotesCollection();
  const now = new Date();

  if (!content) {
    await notes.deleteOne({ userId: uid, lessonId: lesson._id! });
  } else {
    await notes.updateOne(
      { userId: uid, lessonId: lesson._id! },
      {
        $set: { content, updatedAt: now },
        $setOnInsert: {
          userId: uid,
          topicId: lesson.topicId,
          conceptId: lesson.conceptId,
          lessonId: lesson._id!,
          createdAt: now,
        },
      },
      { upsert: true }
    );
  }

  revalidatePath(`/learn/${lesson.conceptId.toString()}`);
}
