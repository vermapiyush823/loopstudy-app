"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getConceptsCollection, getFlashcardsCollection } from "@/lib/db/collections";
import { computeNextReview } from "@/lib/learning/sm2";
import { computeMasteryScore } from "@/lib/learning/mastery";
import { getFlashcardsForConcept } from "@/lib/learning/queries";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function rateFlashcard(cardId: string, rating: 1 | 2 | 3 | 4) {
  const userId = await requireUserId();
  const uid = new ObjectId(userId);

  const flashcards = await getFlashcardsCollection();
  const card = await flashcards.findOne({ _id: new ObjectId(cardId), userId: uid });
  if (!card) throw new Error("Forbidden: flashcard does not belong to user");

  const now = new Date();
  const next = computeNextReview(
    rating,
    { easeFactor: card.easeFactor, interval: card.interval, repetitions: card.repetitions },
    now
  );

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
      },
    }
  );

  if (card.conceptId) {
    const siblingCards = await getFlashcardsForConcept(userId, card.conceptId);
    const masteryScore = computeMasteryScore(
      siblingCards.map((c) =>
        c._id!.equals(card._id!)
          ? { easeFactor: next.easeFactor, repetitions: next.repetitions, nextReviewDate: next.nextReviewDate }
          : { easeFactor: c.easeFactor, repetitions: c.repetitions, nextReviewDate: c.nextReviewDate }
      ),
      now
    );
    if (masteryScore !== undefined) {
      const concepts = await getConceptsCollection();
      await concepts.updateOne(
        { _id: card.conceptId },
        { $set: { masteryScore, masteryUpdatedAt: now } }
      );
    }
  }

  revalidatePath("/");
}
