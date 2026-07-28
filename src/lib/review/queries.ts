import { ObjectId } from "mongodb";
import { getFlashcardsCollection, type Flashcard } from "@/lib/db/collections";

export interface DueFlashcard extends Flashcard {
  topicName: string;
  topicSlug: string;
}

export async function getDueFlashcards(userId: string): Promise<DueFlashcard[]> {
  const flashcards = await getFlashcardsCollection();
  return flashcards
    .aggregate<DueFlashcard>([
      { $match: { userId: new ObjectId(userId), nextReviewDate: { $lte: new Date() } } },
      { $sort: { nextReviewDate: 1 } },
      {
        $lookup: {
          from: "topics",
          localField: "topicId",
          foreignField: "_id",
          as: "topic",
        },
      },
      { $unwind: "$topic" },
      { $addFields: { topicName: "$topic.name", topicSlug: "$topic.slug" } },
      { $project: { topic: 0 } },
    ])
    .toArray();
}

export async function getDueFlashcardsForTopic(
  userId: string,
  topicId: ObjectId
): Promise<Flashcard[]> {
  const flashcards = await getFlashcardsCollection();
  return flashcards
    .find({ userId: new ObjectId(userId), topicId, nextReviewDate: { $lte: new Date() } })
    .sort({ nextReviewDate: 1 })
    .toArray();
}

export async function getFlashcardsForConceptReview(
  userId: string,
  conceptId: ObjectId,
  options: { dueOnly?: boolean } = {}
): Promise<Flashcard[]> {
  const flashcards = await getFlashcardsCollection();
  const match: Record<string, unknown> = { userId: new ObjectId(userId), conceptId };
  if (options.dueOnly) {
    match.nextReviewDate = { $lte: new Date() };
  }
  return flashcards.find(match).sort({ nextReviewDate: 1 }).toArray();
}

export interface DueSummary {
  totalCount: number;
  topics: { name: string; slug: string; count: number }[];
}

export async function getDueSummary(userId: string): Promise<DueSummary> {
  const flashcards = await getFlashcardsCollection();
  const rows = await flashcards
    .aggregate<{ name: string; slug: string; count: number }>([
      { $match: { userId: new ObjectId(userId), nextReviewDate: { $lte: new Date() } } },
      { $group: { _id: "$topicId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "topics",
          localField: "_id",
          foreignField: "_id",
          as: "topic",
        },
      },
      { $unwind: "$topic" },
      { $project: { _id: 0, name: "$topic.name", slug: "$topic.slug", count: 1 } },
      { $sort: { name: 1 } },
    ])
    .toArray();

  return {
    totalCount: rows.reduce((sum, r) => sum + r.count, 0),
    topics: rows,
  };
}
