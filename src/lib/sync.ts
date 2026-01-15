import { supabase } from '@/integrations/supabase/client';
import { 
  getDecks, 
  getCards, 
  getReviews, 
  getProgress, 
  getDailyStats, 
  getReviewLogs, 
  getPomodoroSessions,
  saveDeck,
  saveCard,
  saveReview,
  saveProgress,
  updateTodayStats,
  savePomodoroSession,
  saveReviewLog
} from '@/lib/storage';
import { Deck, Flashcard, FlashcardReview, UserProgress, DailyStats, ReviewLog, PomodoroSession } from '@/types/study';

interface SyncResult {
  success: boolean;
  error?: string;
  pushed: number;
  pulled: number;
}

// Convert Date objects to ISO strings for storage
function toISODate(date: Date | string | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

// Compare timestamps - returns true if local is newer
function isLocalNewer(localUpdatedAt: Date, cloudUpdatedAt: string | null): boolean {
  if (!cloudUpdatedAt) return true;
  return new Date(localUpdatedAt) > new Date(cloudUpdatedAt);
}

export async function syncDecks(userId: string): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0;
  let pulled = 0;
  
  const localDecks = getDecks();
  
  // Get cloud decks
  const { data: cloudDecks, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to fetch decks: ${error.message}`);
  
  const cloudDeckMap = new Map(cloudDecks?.map(d => [d.id, d]) || []);
  const localDeckMap = new Map(localDecks.map(d => [d.id, d]));
  
  // Push local decks to cloud
  for (const localDeck of localDecks) {
    const cloudDeck = cloudDeckMap.get(localDeck.id);
    
    if (!cloudDeck || isLocalNewer(localDeck.updatedAt, cloudDeck.updated_at)) {
      const { error: upsertError } = await supabase
        .from('decks')
        .upsert({
          id: localDeck.id,
          user_id: userId,
          title: localDeck.title,
          description: localDeck.description || null,
          card_count: localDeck.cardCount,
          due_count: localDeck.dueCount,
          created_at: toISODate(localDeck.createdAt),
          updated_at: toISODate(localDeck.updatedAt),
        }, { onConflict: 'id' });
      
      if (!upsertError) pushed++;
    }
  }
  
  // Pull cloud decks to local
  for (const cloudDeck of cloudDecks || []) {
    const localDeck = localDeckMap.get(cloudDeck.id);
    
    if (!localDeck || !isLocalNewer(localDeck.updatedAt, cloudDeck.updated_at)) {
      const deck: Deck = {
        id: cloudDeck.id,
        title: cloudDeck.title,
        description: cloudDeck.description || undefined,
        cardCount: cloudDeck.card_count,
        dueCount: cloudDeck.due_count,
        createdAt: new Date(cloudDeck.created_at),
        updatedAt: new Date(cloudDeck.updated_at),
      };
      saveDeck(deck);
      pulled++;
    }
  }
  
  return { pushed, pulled };
}

export async function syncFlashcards(userId: string): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0;
  let pulled = 0;
  
  const localCards = getCards();
  
  // Get cloud cards
  const { data: cloudCards, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to fetch flashcards: ${error.message}`);
  
  const cloudCardMap = new Map(cloudCards?.map(c => [c.id, c]) || []);
  const localCardMap = new Map(localCards.map(c => [c.id, c]));
  
  // Push local cards to cloud
  for (const localCard of localCards) {
    const cloudCard = cloudCardMap.get(localCard.id);
    
    if (!cloudCard || isLocalNewer(localCard.updatedAt, cloudCard.updated_at)) {
      const { error: upsertError } = await supabase
        .from('flashcards')
        .upsert({
          id: localCard.id,
          user_id: userId,
          deck_id: localCard.deckId,
          question: localCard.question,
          answer: localCard.answer,
          created_at: toISODate(localCard.createdAt),
          updated_at: toISODate(localCard.updatedAt),
        }, { onConflict: 'id' });
      
      if (!upsertError) pushed++;
    }
  }
  
  // Pull cloud cards to local
  for (const cloudCard of cloudCards || []) {
    const localCard = localCardMap.get(cloudCard.id);
    
    if (!localCard || !isLocalNewer(localCard.updatedAt, cloudCard.updated_at)) {
      const card: Flashcard = {
        id: cloudCard.id,
        deckId: cloudCard.deck_id,
        question: cloudCard.question,
        answer: cloudCard.answer,
        createdAt: new Date(cloudCard.created_at),
        updatedAt: new Date(cloudCard.updated_at),
      };
      saveCard(card);
      pulled++;
    }
  }
  
  return { pushed, pulled };
}

export async function syncReviews(userId: string): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0;
  let pulled = 0;
  
  const localReviews = getReviews();
  
  // Get cloud reviews
  const { data: cloudReviews, error } = await supabase
    .from('flashcard_reviews')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);
  
  const cloudReviewMap = new Map(cloudReviews?.map(r => [r.card_id, r]) || []);
  const localReviewMap = new Map(localReviews.map(r => [r.cardId, r]));
  
  // Push local reviews to cloud
  for (const localReview of localReviews) {
    const cloudReview = cloudReviewMap.get(localReview.cardId);
    
    if (!cloudReview || isLocalNewer(localReview.updatedAt, cloudReview.updated_at)) {
      const { error: upsertError } = await supabase
        .from('flashcard_reviews')
        .upsert({
          id: localReview.id,
          user_id: userId,
          card_id: localReview.cardId,
          ease_factor: localReview.easeFactor,
          interval: localReview.interval,
          repetitions: localReview.repetitions,
          next_review: toISODate(localReview.nextReview),
          last_reviewed: localReview.lastReviewed ? toISODate(localReview.lastReviewed) : null,
          created_at: toISODate(localReview.createdAt),
          updated_at: toISODate(localReview.updatedAt),
        }, { onConflict: 'user_id, card_id' });
      
      if (!upsertError) pushed++;
    }
  }
  
  // Pull cloud reviews to local
  for (const cloudReview of cloudReviews || []) {
    const localReview = localReviewMap.get(cloudReview.card_id);
    
    if (!localReview || !isLocalNewer(localReview.updatedAt, cloudReview.updated_at)) {
      const review: FlashcardReview = {
        id: cloudReview.id,
        cardId: cloudReview.card_id,
        easeFactor: cloudReview.ease_factor,
        interval: cloudReview.interval,
        repetitions: cloudReview.repetitions,
        nextReview: new Date(cloudReview.next_review),
        lastReviewed: cloudReview.last_reviewed ? new Date(cloudReview.last_reviewed) : undefined,
        createdAt: new Date(cloudReview.created_at),
        updatedAt: new Date(cloudReview.updated_at),
      };
      saveReview(review);
      pulled++;
    }
  }
  
  return { pushed, pulled };
}

export async function syncProgress(userId: string): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0;
  let pulled = 0;
  
  const localProgress = getProgress();
  
  // Get cloud progress
  const { data: cloudProgress, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch progress: ${error.message}`);
  }
  
  if (!cloudProgress || isLocalNewer(localProgress.updatedAt, cloudProgress.updated_at)) {
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        total_cards_reviewed: localProgress.totalCardsReviewed,
        total_study_time: localProgress.totalStudyTime,
        current_streak: localProgress.currentStreak,
        longest_streak: localProgress.longestStreak,
        last_study_date: localProgress.lastStudyDate ? new Date(localProgress.lastStudyDate).toISOString().split('T')[0] : null,
        updated_at: toISODate(localProgress.updatedAt),
      }, { onConflict: 'user_id' });
    
    if (!upsertError) pushed++;
  } else if (cloudProgress) {
    const progress: UserProgress = {
      totalCardsReviewed: cloudProgress.total_cards_reviewed,
      totalStudyTime: cloudProgress.total_study_time,
      currentStreak: cloudProgress.current_streak,
      longestStreak: cloudProgress.longest_streak,
      lastStudyDate: cloudProgress.last_study_date ? new Date(cloudProgress.last_study_date) : undefined,
      updatedAt: new Date(cloudProgress.updated_at),
    };
    saveProgress(progress);
    pulled++;
  }
  
  return { pushed, pulled };
}

export async function syncDailyStats(userId: string): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0;
  let pulled = 0;
  
  const localStats = getDailyStats();
  
  // Get cloud stats
  const { data: cloudStats, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw new Error(`Failed to fetch daily stats: ${error.message}`);
  
  const cloudStatsMap = new Map(cloudStats?.map(s => [s.date, s]) || []);
  const localStatsMap = new Map(localStats.map(s => [s.date, s]));
  
  // Push local stats to cloud
  for (const localStat of localStats) {
    const cloudStat = cloudStatsMap.get(localStat.date);
    
    if (!cloudStat || isLocalNewer(localStat.updatedAt, cloudStat.updated_at)) {
      const { error: upsertError } = await supabase
        .from('daily_stats')
        .upsert({
          user_id: userId,
          date: localStat.date,
          cards_reviewed: localStat.cardsReviewed,
          cards_learned: localStat.cardsLearned,
          study_time: localStat.studyTime,
          accuracy: localStat.accuracy,
          pomodoros_completed: localStat.pomodorosCompleted,
          updated_at: toISODate(localStat.updatedAt),
        }, { onConflict: 'user_id, date' });
      
      if (!upsertError) pushed++;
    }
  }
  
  // Pull cloud stats to local
  for (const cloudStat of cloudStats || []) {
    const localStat = localStatsMap.get(cloudStat.date);
    
    if (!localStat || !isLocalNewer(localStat.updatedAt, cloudStat.updated_at)) {
      const stat: DailyStats = {
        date: cloudStat.date,
        cardsReviewed: cloudStat.cards_reviewed,
        cardsLearned: cloudStat.cards_learned,
        studyTime: cloudStat.study_time,
        accuracy: cloudStat.accuracy,
        pomodorosCompleted: cloudStat.pomodoros_completed,
        sessionsCompleted: 0,
        updatedAt: new Date(cloudStat.updated_at),
      };
      // Save directly to localStorage
      const allStats = getDailyStats();
      const existingIndex = allStats.findIndex(s => s.date === cloudStat.date);
      if (existingIndex >= 0) {
        allStats[existingIndex] = stat;
      } else {
        allStats.push(stat);
      }
      localStorage.setItem('studyflow_daily_stats', JSON.stringify(allStats));
      pulled++;
    }
  }
  
  return { pushed, pulled };
}

export async function syncAll(userId: string): Promise<SyncResult> {
  try {
    let totalPushed = 0;
    let totalPulled = 0;
    
    // Sync in order: decks -> cards -> reviews -> progress -> stats
    const deckResult = await syncDecks(userId);
    totalPushed += deckResult.pushed;
    totalPulled += deckResult.pulled;
    
    const cardResult = await syncFlashcards(userId);
    totalPushed += cardResult.pushed;
    totalPulled += cardResult.pulled;
    
    const reviewResult = await syncReviews(userId);
    totalPushed += reviewResult.pushed;
    totalPulled += reviewResult.pulled;
    
    const progressResult = await syncProgress(userId);
    totalPushed += progressResult.pushed;
    totalPulled += progressResult.pulled;
    
    const statsResult = await syncDailyStats(userId);
    totalPushed += statsResult.pushed;
    totalPulled += statsResult.pulled;
    
    return {
      success: true,
      pushed: totalPushed,
      pulled: totalPulled,
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      pushed: 0,
      pulled: 0,
    };
  }
}
