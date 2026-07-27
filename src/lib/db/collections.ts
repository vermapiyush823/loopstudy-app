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

export interface Flashcard {
  _id?: ObjectId;
  userId: ObjectId;
  topicId: ObjectId;
  conceptId?: ObjectId;
  lessonId?: ObjectId;
  question: string;
  answer: string;
  source: "ai" | "manual";
  createdAt: Date;
  updatedAt: Date;
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

export async function getFlashcardsCollection(): Promise<Collection<Flashcard>> {
  const db = await getDb();
  return db.collection<Flashcard>("flashcards");
}

export async function getBlogPostsCollection(): Promise<Collection<BlogPost>> {
  const db = await getDb();
  return db.collection<BlogPost>("blogPosts");
}
