const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.8;
const REPETITIONS_CAP = 5;
const OVERDUE_PENALTY = 0.3;

export interface MasteryCardInput {
  easeFactor: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Derives a 0-100 "how well is this concept known" score from the SM-2 state
 * of its flashcards. Pure and deterministic, like sm2.ts's computeNextReview.
 */
export function computeMasteryScore(cards: MasteryCardInput[], now: Date): number | undefined {
  if (cards.length === 0) return undefined;

  const scores = cards.map((card) => {
    const easeRatio = clamp(
      (card.easeFactor - MIN_EASE_FACTOR) / (MAX_EASE_FACTOR - MIN_EASE_FACTOR),
      0,
      1
    );
    const repetitionWeight = clamp(card.repetitions / REPETITIONS_CAP, 0, 1);
    let score = easeRatio * repetitionWeight;

    if (card.nextReviewDate < now) {
      score *= 1 - OVERDUE_PENALTY;
    }

    return score;
  });

  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(average * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
