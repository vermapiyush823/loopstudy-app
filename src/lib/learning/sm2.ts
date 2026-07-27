const MIN_EASE_FACTOR = 1.3;

/** Again/Hard/Good/Easy → SM-2's 0-5 quality scale (0 and 3-5, matching SM-2's own pass/fail split at 3). */
const RATING_TO_QUALITY: Record<1 | 2 | 3 | 4, number> = {
  1: 0,
  2: 3,
  3: 4,
  4: 5,
};

export interface Sm2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  nextReviewDate: Date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Standard SM-2: quality < 3 resets the card; quality >= 3 grows the interval. */
export function computeNextReview(
  rating: 1 | 2 | 3 | 4,
  current: Sm2State,
  now: Date
): Sm2Result {
  const quality = RATING_TO_QUALITY[rating];
  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    current.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    return { easeFactor, interval: 1, repetitions: 0, nextReviewDate: addDays(now, 1) };
  }

  const repetitions = current.repetitions + 1;
  const interval =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(current.interval * easeFactor);

  return { easeFactor, interval, repetitions, nextReviewDate: addDays(now, interval) };
}
