import { FlashcardReview, ReviewRating, ReviewLog } from '@/types/study';
import { saveReview, getProgress, saveProgress, updateTodayStats, getTodayStats, updateStreak, updateDeckCounts, getCards, saveReviewLog, generateId } from './storage';

/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * Quality ratings:
 * - again (0): Complete blackout, reset
 * - hard (3): Correct with difficulty
 * - good (4): Correct with some hesitation
 * - easy (5): Perfect response
 */

const RATING_SCORES: Record<ReviewRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export function calculateNextReview(
  review: FlashcardReview,
  rating: ReviewRating
): FlashcardReview {
  const quality = RATING_SCORES[rating];
  let { interval, easeFactor, repetitions } = review;

  if (quality < 3) {
    // Failed - reset to beginning
    repetitions = 0;
    interval = 1;
  } else {
    // Successful review
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    repetitions += 1;

    // Adjust ease factor (EF)
    // EF' = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // EF should never be less than 1.3
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }
  }

  // Apply modifiers based on rating
  if (rating === 'hard') {
    interval = Math.max(1, Math.round(interval * 0.8));
  } else if (rating === 'easy') {
    interval = Math.round(interval * 1.3);
  }

  // Add small random fuzz to interval to prevent card bunching (if interval > 3 days)
  if (interval > 3) {
    // Fuzz factor: +/- 5-10% variation
    const fuzz = Math.floor(interval * (0.05 + Math.random() * 0.05));
    const direction = Math.random() > 0.5 ? 1 : -1;
    interval = interval + (fuzz * direction);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...review,
    interval,
    easeFactor,
    repetitions,
    nextReview,
    lastReviewed: new Date(),
    updatedAt: new Date(),
  };
}

export function processReview(
  review: FlashcardReview,
  rating: ReviewRating,
  responseTime: number = 3000
): FlashcardReview {
  const updatedReview = calculateNextReview(review, rating);
  saveReview(updatedReview);

  // Get the card to find its deck
  const card = getCards().find(c => c.id === review.cardId);

  // Log review for analytics
  if (card) {
    const reviewLog: ReviewLog = {
      id: generateId(),
      cardId: review.cardId,
      deckId: card.deckId,
      rating,
      responseTime,
      timestamp: new Date(),
      wasCorrect: rating !== 'again'
    };
    saveReviewLog(reviewLog);
  }

  // Update progress
  const progress = getProgress();
  progress.totalCardsReviewed += 1;
  saveProgress(progress);

  // Update daily stats
  const todayStats = getTodayStats();
  updateTodayStats({
    cardsReviewed: todayStats.cardsReviewed + 1,
    cardsLearned: review.repetitions === 0 ? todayStats.cardsLearned + 1 : todayStats.cardsLearned,
  });

  // Update streak
  updateStreak();

  // Update deck due counts
  if (card) {
    updateDeckCounts(card.deckId);
  }

  return updatedReview;
}

export function getIntervalText(interval: number): string {
  if (interval === 0) return 'New';
  if (interval === 1) return '1 day';
  if (interval < 7) return `${interval} days`;
  if (interval < 30) return `${Math.round(interval / 7)} weeks`;
  if (interval < 365) return `${Math.round(interval / 30)} months`;
  return `${Math.round(interval / 365)} years`;
}

export function getNextReviewText(rating: ReviewRating, currentInterval: number): string {
  // Simulate what the next interval would be
  const now = new Date();
  const mockReview: FlashcardReview = {
    id: '',
    cardId: '',
    interval: currentInterval,
    easeFactor: 2.5,
    repetitions: currentInterval > 0 ? 2 : 0,
    nextReview: now,
    lastReviewed: undefined,
    createdAt: now,
    updatedAt: now,
  };

  const next = calculateNextReview(mockReview, rating);
  return getIntervalText(next.interval);
}
