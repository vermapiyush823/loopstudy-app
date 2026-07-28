import { Collection, ObjectId } from "mongodb";
import clientPromise from "@/lib/db/mongodb";

export interface Topic {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isPredefined: boolean;
  parentTopicId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/** One step in a topic's AI-generated learning path. */
export interface Concept {
  _id?: ObjectId;
  userId: ObjectId;
  topicId: ObjectId;
  order: number;
  title: string;
  summary: string;
  status: "not_started" | "in_progress" | "completed";
  /** Derived 0-100 signal from sibling flashcards' SM-2 state; unset until the concept has cards. */
  masteryScore?: number;
  masteryUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The AI-generated teaching content for a single concept — one streamed
 * Markdown document (explanation, real-world examples, and key takeaways
 * all as sections the model writes itself), not separate structured fields.
 * Kept as one blob so the lesson can stream to the client as plain text.
 */
export interface Lesson {
  _id?: ObjectId;
  userId: ObjectId;
  topicId: ObjectId;
  conceptId: ObjectId;
  title: string;
  content: string;
  createdAt: Date;
}

/** Optional private scratchpad the user keeps on a lesson. */
export interface LessonNote {
  _id?: ObjectId;
  userId: ObjectId;
  topicId: ObjectId;
  conceptId: ObjectId;
  lessonId: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SM-2 scheduling fields live directly on the card: easeFactor/interval/repetitions
 * track the algorithm's state, nextReviewDate is what the due-queue queries filter on.
 */
export interface Flashcard {
  _id?: ObjectId;
  userId: ObjectId;
  topicId: ObjectId;
  conceptId?: ObjectId;
  lessonId?: ObjectId;
  question: string;
  answer: string;
  source: "ai" | "manual";
  /** Multiple-choice distractors (correct answer is the `answer` field above). */
  options: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One rating event, recorded alongside the in-place SM-2 update on the Flashcard doc. */
export interface ReviewLog {
  _id?: ObjectId;
  userId: ObjectId;
  flashcardId: ObjectId;
  conceptId?: ObjectId;
  topicId: ObjectId;
  rating: 1 | 2 | 3 | 4;
  wasCorrect: boolean;
  easeFactorBefore: number;
  easeFactorAfter: number;
  intervalBefore: number;
  intervalAfter: number;
  reviewedAt: Date;
}

/** A persisted, lesson-grounded follow-up question the learner asked. */
export interface LessonQuestion {
  _id?: ObjectId;
  userId: ObjectId;
  topicId: ObjectId;
  conceptId: ObjectId;
  lessonId: ObjectId;
  question: string;
  answer: string;
  createdAt: Date;
}

/** Auth.js's MongoDB adapter owns this collection (default name "users") — read-only here. */
export interface AppUser {
  _id: ObjectId;
  name?: string;
  email?: string;
  emailVerified?: Date | null;
  image?: string;
}

/** Independent of the study side — the user writes these when they want to. */
export interface BlogPost {
  _id?: ObjectId;
  userId: ObjectId;
  topicId?: ObjectId;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  excerpt?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

export async function getTopicsCollection(): Promise<Collection<Topic>> {
  const db = await getDb();
  return db.collection<Topic>("topics");
}

export async function getConceptsCollection(): Promise<Collection<Concept>> {
  const db = await getDb();
  return db.collection<Concept>("concepts");
}

export async function getLessonsCollection(): Promise<Collection<Lesson>> {
  const db = await getDb();
  return db.collection<Lesson>("lessons");
}

export async function getLessonNotesCollection(): Promise<Collection<LessonNote>> {
  const db = await getDb();
  return db.collection<LessonNote>("lessonNotes");
}

export async function getLessonQuestionsCollection(): Promise<Collection<LessonQuestion>> {
  const db = await getDb();
  return db.collection<LessonQuestion>("lessonQuestions");
}

export async function getFlashcardsCollection(): Promise<Collection<Flashcard>> {
  const db = await getDb();
  return db.collection<Flashcard>("flashcards");
}

export async function getReviewLogsCollection(): Promise<Collection<ReviewLog>> {
  const db = await getDb();
  return db.collection<ReviewLog>("reviewLogs");
}

export async function getBlogPostsCollection(): Promise<Collection<BlogPost>> {
  const db = await getDb();
  return db.collection<BlogPost>("blogPosts");
}

export async function getUsersCollection(): Promise<Collection<AppUser>> {
  const db = await getDb();
  return db.collection<AppUser>("users");
}
