"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import {
  getConceptsCollection,
  getFlashcardsCollection,
  getReviewLogsCollection,
} from "@/lib/db/collections";
import { computeNextReview } from "@/lib/learning/sm2";
import { computeMasteryScore } from "@/lib/learning/mastery";
import { getFlashcardsForConcept } from "@/lib/learning/queries";

/** Consecutive lapses ("Again" ratings) before a card is flagged as a leech. */
const LEECH_THRESHOLD = 8;

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function rateFlashcard(cardId: string, rating: 1 | 2 | 3 | 4, wasCorrect: boolean) {
  const userId = await requireUserId();
  const uid = new ObjectId(userId);

  const flashcards = await getFlashcardsCollection();
  const card = await flashcards.findOne({ _id: new ObjectId(cardId), userId: uid });
  if (!card) throw new Error("Forbidden: flashcard does not belong to user");

  if (!wasCorrect && rating !== 1) {
    throw new Error("Invalid rating: incorrect answers can only be rated Again");
  }
  if (wasCorrect && rating === 1) {
    throw new Error("Invalid rating: correct answers cannot be rated Again");
  }

  const now = new Date();
  const next = computeNextReview(
    rating,
    { easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions },
    now
  );

  const lapseCount = rating === 1 ? (card.lapseCount ?? 0) + 1 : 0;
  const isLeech = lapseCount >= LEECH_THRESHOLD;

  await flashcards.updateOne(
    { _id: card._id },
    {
      $set: {
        easeFactor: next.easeFactor,
        interval: next.interval,
        repetitions: next.repetitions,
        nextReviewDate: next.nextReviewDate,
        lastReviewedAt: now,
        updatedAt: now,
        lapseCount,
        isLeech,
      },
    }
  );

  const reviewLogs = await getReviewLogsCollection();
  await reviewLogs.insertOne({
    userId: uid,
    flashcardId: card._id!,
    conceptId: card.conceptId,
    topicId: card.topicId,
    rating,
    wasCorrect,
    easeFactorBefore: card.easeFactor,
    easeFactorAfter: next.easeFactor,
    intervalBefore: card.interval,
    intervalAfter: next.interval,
    reviewedAt: now,
  });

  // Mastery is a derived, display-only signal — recompute it after the response
  // is sent instead of making the reviewer wait on an extra sibling-card fetch.
  if (card.conceptId) {
    const conceptId = card.conceptId;
    const cardId = card._id!;
    after(async () => {
      const siblingCards = await getFlashcardsForConcept(userId, conceptId);
      const masteryScore = computeMasteryScore(
        siblingCards.map((c) =>
          c._id!.equals(cardId)
            ? { easeFactor: next.easeFactor, repetitions: next.repetitions, nextReviewDate: next.nextReviewDate }
            : { easeFactor: c.easeFactor, repetitions: c.repetitions, nextReviewDate: c.nextReviewDate }
        ),
        now
      );
      if (masteryScore !== undefined) {
        const concepts = await getConceptsCollection();
        await concepts.updateOne(
          { _id: conceptId },
          { $set: { masteryScore, masteryUpdatedAt: now } }
        );
      }
    });
  }

  revalidatePath("/");
  return { isLeech };
}
