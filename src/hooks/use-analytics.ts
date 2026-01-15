import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DeckAnalytics,
  StudyEfficiency,
  DailyStats,
  ReviewLog,
  FlashcardReview
} from '@/types/study';
import {
  getDecks,
  getCards,
  getReviews,
  getReviewLogs,
  getDailyStats,
  getCardsByDeck,
  getQuizAttempts,
  getQuizzes,
  getProgress
} from '@/lib/storage';

export interface RetentionDataPoint {
  date: string;
  retention: number;
  reviews: number;
}

export interface WeakTopic {
  deckId: string;
  deckTitle: string;
  cardId: string;
  question: string;
  failureRate: number;
  lastReviewed: Date | null;
}

export interface StudyHeatmapData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  topScore: number;
}

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [deckAnalytics, setDeckAnalytics] = useState<DeckAnalytics[]>([]);
  const [studyEfficiency, setStudyEfficiency] = useState<StudyEfficiency | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionDataPoint[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [heatmapData, setHeatmapData] = useState<StudyHeatmapData[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null); // Using any temporarily to avoid circular dep issues if types aren't fully propagated yet, or import UserProgress type.

  const calculateAnalytics = useCallback(() => {
    const decks = getDecks();
    const cards = getCards();
    const reviews = getReviews();
    const reviewLogs = getReviewLogs();
    const dailyStats = getDailyStats();
    const quizAttempts = getQuizAttempts();
    const quizzes = getQuizzes();
    const progress = getProgress();
    setUserProgress(progress);

    // Calculate deck analytics
    const deckAnalyticsData: DeckAnalytics[] = decks.map(deck => {
      const deckCards = cards.filter(c => c.deckId === deck.id);
      const deckReviews = reviews.filter(r =>
        deckCards.some(c => c.id === r.cardId)
      );
      const deckLogs = reviewLogs.filter(l => l.deckId === deck.id);

      // Categorize cards
      const masteredCards = deckReviews.filter(r => r.interval >= 21).length;
      const learningCards = deckReviews.filter(r => r.interval > 0 && r.interval < 21).length;
      const newCards = deckCards.length - masteredCards - learningCards;

      // Calculate retention rate
      const correctLogs = deckLogs.filter(l => l.wasCorrect);
      const retentionRate = deckLogs.length > 0
        ? Math.round((correctLogs.length / deckLogs.length) * 100)
        : 0;

      // Calculate average ease factor
      const avgEaseFactor = deckReviews.length > 0
        ? deckReviews.reduce((sum, r) => sum + r.easeFactor, 0) / deckReviews.length
        : 2.5;

      // Find weak cards (cards with high failure rate)
      const cardFailureRates = deckCards.map(card => {
        const cardLogs = deckLogs.filter(l => l.cardId === card.id);
        const failures = cardLogs.filter(l => !l.wasCorrect).length;
        return {
          cardId: card.id,
          failureRate: cardLogs.length > 0 ? failures / cardLogs.length : 0
        };
      });
      const weakCards = cardFailureRates
        .filter(c => c.failureRate > 0.3)
        .sort((a, b) => b.failureRate - a.failureRate)
        .slice(0, 5)
        .map(c => c.cardId);

      return {
        deckId: deck.id,
        deckTitle: deck.title,
        totalCards: deckCards.length,
        masteredCards,
        learningCards,
        newCards,
        retentionRate,
        averageEaseFactor: Math.round(avgEaseFactor * 100) / 100,
        weakCards
      };
    });

    setDeckAnalytics(deckAnalyticsData);

    // Calculate overall study efficiency
    const last30DaysLogs = reviewLogs.filter(l => {
      const logDate = new Date(l.timestamp);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return logDate >= thirtyDaysAgo;
    });

    if (last30DaysLogs.length > 0) {
      const correctRate = last30DaysLogs.filter(l => l.wasCorrect).length / last30DaysLogs.length;
      const avgResponseTime = last30DaysLogs.reduce((sum, l) => sum + l.responseTime, 0) / last30DaysLogs.length;

      // Calculate consistency (how regularly user studies)
      const studyDays = new Set(last30DaysLogs.map(l =>
        new Date(l.timestamp).toISOString().split('T')[0]
      )).size;
      const consistencyScore = Math.min(100, Math.round((studyDays / 30) * 100));

      // Calculate improvement trend (compare last 15 days vs previous 15 days)
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const recentLogs = last30DaysLogs.filter(l => new Date(l.timestamp) >= fifteenDaysAgo);
      const olderLogs = last30DaysLogs.filter(l => new Date(l.timestamp) < fifteenDaysAgo);

      const recentCorrectRate = recentLogs.length > 0
        ? recentLogs.filter(l => l.wasCorrect).length / recentLogs.length
        : 0;
      const olderCorrectRate = olderLogs.length > 0
        ? olderLogs.filter(l => l.wasCorrect).length / olderLogs.length
        : 0;
      const improvementTrend = Math.round((recentCorrectRate - olderCorrectRate) * 100);

      // Calculate overall efficiency score
      const efficiencyScore = Math.round(
        (correctRate * 40) +
        (consistencyScore * 0.3) +
        (Math.max(0, 30 - avgResponseTime / 1000) * 1) // Bonus for quick responses
      );

      setStudyEfficiency({
        score: Math.min(100, Math.max(0, efficiencyScore)),
        averageResponseTime: Math.round(avgResponseTime),
        correctRate: Math.round(correctRate * 100),
        consistencyScore,
        improvementTrend
      });
    } else {
      setStudyEfficiency(null);
    }

    // Calculate retention data over time
    const last14Days: RetentionDataPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = reviewLogs.filter(l =>
        new Date(l.timestamp).toISOString().split('T')[0] === dateStr
      );
      const retention = dayLogs.length > 0
        ? Math.round((dayLogs.filter(l => l.wasCorrect).length / dayLogs.length) * 100)
        : 0;

      last14Days.push({
        date: dateStr,
        retention,
        reviews: dayLogs.length
      });
    }
    setRetentionData(last14Days);

    // Find weak topics across all decks
    const allWeakTopics: WeakTopic[] = [];
    decks.forEach(deck => {
      const deckCards = cards.filter(c => c.deckId === deck.id);
      const deckLogs = reviewLogs.filter(l => l.deckId === deck.id);

      deckCards.forEach(card => {
        const cardLogs = deckLogs.filter(l => l.cardId === card.id);
        if (cardLogs.length >= 2) {
          const failures = cardLogs.filter(l => !l.wasCorrect).length;
          const failureRate = failures / cardLogs.length;

          if (failureRate > 0.4) {
            const review = reviews.find(r => r.cardId === card.id);
            allWeakTopics.push({
              deckId: deck.id,
              deckTitle: deck.title,
              cardId: card.id,
              question: card.question,
              failureRate: Math.round(failureRate * 100),
              lastReviewed: review?.lastReviewed || null
            });
          }
        }
      });
    });

    setWeakTopics(
      allWeakTopics
        .sort((a, b) => b.failureRate - a.failureRate)
        .slice(0, 10)
    );

    // Calculate heatmap data (last 90 days)
    const heatmap: StudyHeatmapData[] = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = dailyStats.find(d => d.date === dateStr);
      // Activity count = cards reviewed + sessions completed (which includes quizzes now)
      const count = (dayStats?.cardsReviewed || 0) + ((dayStats?.sessionsCompleted || 0) * 5);

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) level = 1;
      if (count >= 10) level = 2;
      if (count >= 25) level = 3;
      if (count >= 50) level = 4;

      heatmap.push({ date: dateStr, count, level });
    }
    setHeatmapData(heatmap);

    // Calculate Quiz Stats
    if (quizAttempts.length > 0) {
      const totalAttempts = quizAttempts.length;
      const totalScoreRatio = quizAttempts.reduce((sum, a) => sum + (a.score / a.maxScore), 0);
      const averageScore = Math.round((totalScoreRatio / totalAttempts) * 100);
      const topScore = Math.max(...quizAttempts.map(a => Math.round((a.score / a.maxScore) * 100)));

      setQuizStats({
        totalAttempts,
        averageScore,
        topScore
      });
    } else {
      setQuizStats(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  const refresh = useCallback(() => {
    setLoading(true);
    calculateAnalytics();
  }, [calculateAnalytics]);

  // Aggregate stats
  const totalMastered = useMemo(() =>
    deckAnalytics.reduce((sum, d) => sum + d.masteredCards, 0),
    [deckAnalytics]
  );

  const totalLearning = useMemo(() =>
    deckAnalytics.reduce((sum, d) => sum + d.learningCards, 0),
    [deckAnalytics]
  );

  const overallRetention = useMemo(() => {
    const withData = deckAnalytics.filter(d => d.totalCards > 0);
    if (withData.length === 0) return 0;
    return Math.round(
      withData.reduce((sum, d) => sum + d.retentionRate, 0) / withData.length
    );
  }, [deckAnalytics]);

  return {
    loading,
    deckAnalytics,
    studyEfficiency,
    retentionData,
    weakTopics,
    heatmapData,
    quizStats,
    totalMastered,
    totalLearning,
    overallRetention,
    userProgress,
    refresh
  };
}
