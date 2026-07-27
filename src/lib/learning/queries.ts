import { ObjectId } from "mongodb";
import {
  getConceptsCollection,
  getFlashcardsCollection,
  getLessonNotesCollection,
  getLessonQuestionsCollection,
  getLessonsCollection,
  getTopicsCollection,
  type Concept,
  type Flashcard,
  type Lesson,
  type LessonNote,
  type LessonQuestion,
} from "@/lib/db/collections";

export async function getConceptsForTopic(
  userId: string,
  topicId: ObjectId
): Promise<Concept[]> {
  const concepts = await getConceptsCollection();
  return concepts
    .find({ userId: new ObjectId(userId), topicId })
    .sort({ order: 1 })
    .toArray();
}

export async function getConceptById(
  userId: string,
  conceptId: string
): Promise<Concept | null> {
  const concepts = await getConceptsCollection();
  return concepts.findOne({
    _id: new ObjectId(conceptId),
    userId: new ObjectId(userId),
  });
}

export async function getLessonForConcept(
  userId: string,
  conceptId: ObjectId
): Promise<Lesson | null> {
  const lessons = await getLessonsCollection();
  return lessons.findOne({ userId: new ObjectId(userId), conceptId });
}

export async function getLessonNote(
  userId: string,
  lessonId: ObjectId
): Promise<LessonNote | null> {
  const notes = await getLessonNotesCollection();
  return notes.findOne({ userId: new ObjectId(userId), lessonId });
}

export async function getFlashcardsForLesson(
  userId: string,
  lessonId: ObjectId
): Promise<Flashcard[]> {
  const flashcards = await getFlashcardsCollection();
  return flashcards
    .find({ userId: new ObjectId(userId), lessonId })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function getFlashcardsForConcept(
  userId: string,
  conceptId: ObjectId
): Promise<Flashcard[]> {
  const flashcards = await getFlashcardsCollection();
  return flashcards.find({ userId: new ObjectId(userId), conceptId }).toArray();
}

export async function getLessonQuestions(
  userId: string,
  lessonId: ObjectId
): Promise<LessonQuestion[]> {
  const questions = await getLessonQuestionsCollection();
  return questions
    .find({ userId: new ObjectId(userId), lessonId })
    .sort({ createdAt: 1 })
    .toArray();
}

export interface TopicProgress {
  total: number;
  completed: number;
}

export async function getProgressByTopic(
  userId: string
): Promise<Map<string, TopicProgress>> {
  const concepts = await getConceptsCollection();
  const rows = await concepts
    .aggregate<{ _id: ObjectId; total: number; completed: number }>([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: "$topicId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();

  return new Map(
    rows.map((r) => [r._id.toString(), { total: r.total, completed: r.completed }])
  );
}

export interface StudySuggestion {
  concept: Concept;
  topicName: string;
  topicSlug: string;
  reason: string;
}

/**
 * Picks what to study next: resume anything already in progress, otherwise the
 * next unstarted concept on the least-recently-touched topic that has a path.
 */
export async function getStudySuggestion(
  userId: string
): Promise<StudySuggestion | null> {
  const concepts = await getConceptsCollection();
  const uid = new ObjectId(userId);

  const inProgress = await concepts.findOne(
    { userId: uid, status: "in_progress" },
    { sort: { updatedAt: 1 } }
  );

  const next =
    inProgress ??
    (await concepts.findOne(
      { userId: uid, status: "not_started" },
      { sort: { updatedAt: 1, order: 1 } }
    ));

  if (!next) return null;

  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: next.topicId, userId: uid });
  if (!topic) return null;

  return {
    concept: next,
    topicName: topic.name,
    topicSlug: topic.slug,
    reason: inProgress
      ? "You started this and haven't finished it"
      : `Next up on your ${topic.name} path`,
  };
}
