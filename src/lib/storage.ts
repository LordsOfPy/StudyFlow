import {
  Deck,
  Flashcard,
  FlashcardReview,
  UserProgress,
  DailyStats,
  PomodoroSettings,
  PomodoroSession,
  ReviewLog,
  ReviewRating,
  STORAGE_KEYS,
  LibraryDocument
} from '@/types/study';
import { Quiz, QuizAttempt } from '@/types/quiz';
import { Task, FocusSession } from '@/types/tasks';

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item, (key, value) => {
      // Parse date strings back to Date objects
      if (key === 'createdAt' || key === 'updatedAt' || key === 'nextReview' || key === 'lastReviewed' || key === 'completedAt' || key === 'startedAt' || key === 'timestamp') {
        return value ? new Date(value) : null;
      }
      return value;
    });
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Deck operations
export function getDecks(): Deck[] {
  return getItem<Deck[]>(STORAGE_KEYS.DECKS, []);
}

export function saveDeck(deck: Deck): void {
  const decks = getDecks();
  const existingIndex = decks.findIndex(d => d.id === deck.id);

  if (existingIndex >= 0) {
    decks[existingIndex] = { ...deck, updatedAt: new Date() };
  } else {
    decks.push(deck);
  }

  setItem(STORAGE_KEYS.DECKS, decks);
}

export function deleteDeck(deckId: string): void {
  const decks = getDecks().filter(d => d.id !== deckId);
  setItem(STORAGE_KEYS.DECKS, decks);

  // Also delete all cards in this deck
  const cards = getCards().filter(c => c.deckId !== deckId);
  setItem(STORAGE_KEYS.CARDS, cards);

  // Delete reviews for those cards
  const cardIds = getCards().filter(c => c.deckId === deckId).map(c => c.id);
  const reviews = getReviews().filter(r => !cardIds.includes(r.cardId));
  setItem(STORAGE_KEYS.REVIEWS, reviews);
}

// Card operations
export function getCards(): Flashcard[] {
  return getItem<Flashcard[]>(STORAGE_KEYS.CARDS, []);
}

export function getCardsByDeck(deckId: string): Flashcard[] {
  return getCards().filter(c => c.deckId === deckId);
}

export function saveCard(card: Flashcard): void {
  const cards = getCards();
  const existingIndex = cards.findIndex(c => c.id === card.id);

  if (existingIndex >= 0) {
    cards[existingIndex] = { ...card, updatedAt: new Date() };
  } else {
    cards.push(card);
    // Initialize review for new card
    initializeReview(card.id);
    // Update deck card count
    updateDeckCounts(card.deckId);
  }

  setItem(STORAGE_KEYS.CARDS, cards);
}

export function deleteCard(cardId: string): void {
  const card = getCards().find(c => c.id === cardId);
  const cards = getCards().filter(c => c.id !== cardId);
  setItem(STORAGE_KEYS.CARDS, cards);

  // Delete review
  const reviews = getReviews().filter(r => r.cardId !== cardId);
  setItem(STORAGE_KEYS.REVIEWS, reviews);

  // Update deck count
  if (card) {
    updateDeckCounts(card.deckId);
  }
}

// Review operations
export function getReviews(): FlashcardReview[] {
  return getItem<FlashcardReview[]>(STORAGE_KEYS.REVIEWS, []);
}

export function getReviewByCard(cardId: string): FlashcardReview | undefined {
  return getReviews().find(r => r.cardId === cardId);
}

export function initializeReview(cardId: string): FlashcardReview {
  const now = new Date();
  const review: FlashcardReview = {
    id: generateId(),
    cardId,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: now,
    lastReviewed: undefined,
    createdAt: now,
    updatedAt: now,
  };

  const reviews = getReviews();
  reviews.push(review);
  setItem(STORAGE_KEYS.REVIEWS, reviews);

  return review;
}

export function saveReview(review: FlashcardReview): void {
  const reviews = getReviews();
  const existingIndex = reviews.findIndex(r => r.id === review.id);

  if (existingIndex >= 0) {
    reviews[existingIndex] = review;
  } else {
    reviews.push(review);
  }

  setItem(STORAGE_KEYS.REVIEWS, reviews);
}

// Get due cards for a deck
export function getDueCards(deckId: string): Flashcard[] {
  const cards = getCardsByDeck(deckId);
  const reviews = getReviews();
  const now = new Date();

  return cards.filter(card => {
    const review = reviews.find(r => r.cardId === card.id);
    if (!review) return true; // New cards are due
    return new Date(review.nextReview) <= now;
  });
}

// Update deck counts
export function updateDeckCounts(deckId: string): void {
  const decks = getDecks();
  const deck = decks.find(d => d.id === deckId);

  if (deck) {
    const cards = getCardsByDeck(deckId);
    const dueCards = getDueCards(deckId);

    deck.cardCount = cards.length;
    deck.dueCount = dueCards.length;
    deck.updatedAt = new Date();

    setItem(STORAGE_KEYS.DECKS, decks);
  }
}

// Progress operations
export function getProgress(): UserProgress {
  return getItem<UserProgress>(STORAGE_KEYS.PROGRESS, {
    currentStreak: 0,
    longestStreak: 0,
    totalCardsReviewed: 0,
    totalStudyTime: 0,
    lastStudyDate: undefined,
    xp: 0,
    level: 1,
    nextLevelXp: 100,
    updatedAt: new Date(),
  });
}

export function saveProgress(progress: UserProgress): void {
  setItem(STORAGE_KEYS.PROGRESS, progress);
}

export function updateStreak(): void {
  const progress = getProgress();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastStudyStr = progress.lastStudyDate
    ? new Date(progress.lastStudyDate).toISOString().split('T')[0]
    : null;

  if (lastStudyStr === today) {
    // Already studied today
    return;
  }

  if (lastStudyStr === yesterday) {
    // Continuing streak
    progress.currentStreak += 1;
  } else {
    // Streak broken or first day
    progress.currentStreak = 1;
  }

  if (progress.currentStreak > progress.longestStreak) {
    progress.longestStreak = progress.currentStreak;
  }

  progress.lastStudyDate = new Date();
  progress.updatedAt = new Date();
  saveProgress(progress);
}

export function addXp(amount: number): void {
  const progress = getProgress();
  progress.xp += amount;

  // Level up logic (simple quadratic curve: level * 100)
  while (progress.xp >= progress.nextLevelXp) {
    progress.xp -= progress.nextLevelXp;
    progress.level += 1;
    progress.nextLevelXp = progress.level * 100;
  }

  progress.updatedAt = new Date();
  saveProgress(progress);
}

// Daily stats operations
export function getDailyStats(): DailyStats[] {
  return getItem<DailyStats[]>(STORAGE_KEYS.DAILY_STATS, []);
}

export function getTodayStats(): DailyStats {
  const today = new Date().toISOString().split('T')[0];
  const stats = getDailyStats();
  const todayStats = stats.find(s => s.date === today);

  return todayStats || {
    date: today,
    cardsReviewed: 0,
    cardsLearned: 0,
    studyTime: 0,
    sessionsCompleted: 0,
    accuracy: 0,
    pomodorosCompleted: 0,
    updatedAt: new Date(),
  };
}

export function updateTodayStats(updates: Partial<DailyStats>): void {
  const today = new Date().toISOString().split('T')[0];
  const stats = getDailyStats();
  const todayIndex = stats.findIndex(s => s.date === today);

  const todayStats = getTodayStats();
  const updatedStats = { ...todayStats, ...updates };

  if (todayIndex >= 0) {
    stats[todayIndex] = updatedStats;
  } else {
    stats.push(updatedStats);
  }

  // Keep only last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const filteredStats = stats.filter(s => s.date >= thirtyDaysAgo);

  setItem(STORAGE_KEYS.DAILY_STATS, filteredStats);
}

// Pomodoro settings
export function getPomodoroSettings(): PomodoroSettings {
  return getItem<PomodoroSettings>(STORAGE_KEYS.POMODORO_SETTINGS, {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  });
}

export function savePomodoroSettings(settings: PomodoroSettings): void {
  setItem(STORAGE_KEYS.POMODORO_SETTINGS, settings);
}

// Pomodoro sessions
export function getPomodoroSessions(): PomodoroSession[] {
  return getItem<PomodoroSession[]>(STORAGE_KEYS.POMODORO_SESSIONS, []);
}

export function savePomodoroSession(session: PomodoroSession): void {
  const sessions = getPomodoroSessions();
  sessions.push(session);

  // Keep only last 100 sessions
  const recentSessions = sessions.slice(-100);
  setItem(STORAGE_KEYS.POMODORO_SESSIONS, recentSessions);
}

export function getTodaySessions(): PomodoroSession[] {
  const today = new Date().toISOString().split('T')[0];
  return getPomodoroSessions().filter(s =>
    new Date(s.completedAt).toISOString().split('T')[0] === today
  );
}

// Review log operations for analytics
export function getReviewLogs(): ReviewLog[] {
  return getItem<ReviewLog[]>(STORAGE_KEYS.REVIEW_LOGS, []);
}

export function saveReviewLog(log: ReviewLog): void {
  const logs = getReviewLogs();
  logs.push(log);

  // Keep only last 1000 logs for performance
  const recentLogs = logs.slice(-1000);
  setItem(STORAGE_KEYS.REVIEW_LOGS, recentLogs);
}

export function getReviewLogsByDeck(deckId: string): ReviewLog[] {
  return getReviewLogs().filter(log => log.deckId === deckId);
}

export function getReviewLogsByCard(cardId: string): ReviewLog[] {
  return getReviewLogs().filter(log => log.cardId === cardId);
}

export function getReviewLogsInRange(startDate: Date, endDate: Date): ReviewLog[] {
  return getReviewLogs().filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}

// QUIZ OPERATIONS

export function getQuizzes(): Quiz[] {
  return getItem<Quiz[]>(STORAGE_KEYS.QUIZZES, []);
}

export function saveQuiz(quiz: Quiz): void {
  const quizzes = getQuizzes();
  const existingIndex = quizzes.findIndex(q => q.id === quiz.id);

  if (existingIndex >= 0) {
    quizzes[existingIndex] = { ...quiz, updatedAt: new Date() };
  } else {
    quizzes.push(quiz);
  }

  setItem(STORAGE_KEYS.QUIZZES, quizzes);
}

export function getQuizAttempts(): QuizAttempt[] {
  return getItem<QuizAttempt[]>(STORAGE_KEYS.QUIZ_ATTEMPTS, []);
}

export function saveQuizAttempt(attempt: QuizAttempt): void {
  const attempts = getQuizAttempts();
  attempts.push(attempt);
  setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, attempts);

  // Also update daily stats
  const todayStats = getTodayStats();
  // We can track quizzes in "sessionsCompleted" or add a new field. For now let's say a quiz counts as a session.
  updateTodayStats({ sessionsCompleted: todayStats.sessionsCompleted + 1 });
  updateStreak();
}

export function getDocuments(): LibraryDocument[] {
  return getItem<LibraryDocument[]>(STORAGE_KEYS.DOCUMENTS, []);
}

export function saveDocument(doc: LibraryDocument): void {
  const docs = getDocuments();
  docs.unshift(doc);
  setItem(STORAGE_KEYS.DOCUMENTS, docs);
}

// TASK OPERATIONS

export function getTasks(): Task[] {
  return getItem<Task[]>(STORAGE_KEYS.TASKS, []);
}

export function saveTask(task: Task): void {
  const tasks = getTasks();
  const existingIndex = tasks.findIndex(t => t.id === task.id);

  if (existingIndex >= 0) {
    tasks[existingIndex] = { ...task, updatedAt: new Date() };
  } else {
    tasks.push(task);
  }

  setItem(STORAGE_KEYS.TASKS, tasks);
}

export function deleteTask(taskId: string): void {
  const tasks = getTasks().filter(t => t.id !== taskId);
  setItem(STORAGE_KEYS.TASKS, tasks);
}

// FOCUS SESSION OPERATIONS

export function getFocusSessions(): FocusSession[] {
  return getItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
}

export function saveFocusSession(session: FocusSession): void {
  const sessions = getFocusSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);

  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }

  setItem(STORAGE_KEYS.FOCUS_SESSIONS, sessions);
}

export function deleteFocusSession(sessionId: string): void {
  const sessions = getFocusSessions().filter(s => s.id !== sessionId);
  setItem(STORAGE_KEYS.FOCUS_SESSIONS, sessions);
}
