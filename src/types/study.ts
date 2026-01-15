// Flashcard types
export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  cardType?: 'standard' | 'cloze';
  clozeContent?: string; // For cloze cards: "The capital of {{France}} is Paris"
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardReview {
  id: string;
  cardId: string;
  interval: number; // days until next review
  easeFactor: number; // SM-2 ease factor (starts at 2.5)
  repetitions: number;
  nextReview: Date;
  lastReviewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  cardCount: number;
  dueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryDocument {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link';
  url: string; // Data URL or external link
  summary?: string;
  tags: string[];
  createdAt: Date;
}

// SM-2 Algorithm types
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

// Pomodoro types
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  mode: TimerMode;
  duration: number; // in seconds
  completedAt: Date;
}

export interface PomodoroSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

// Progress types
export interface DailyStats {
  date: string; // YYYY-MM-DD
  cardsReviewed: number;
  cardsLearned: number;
  studyTime: number; // in seconds
  sessionsCompleted: number;
  accuracy: number;
  pomodorosCompleted: number;
  updatedAt: Date;
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalCardsReviewed: number;
  totalStudyTime: number;
  lastStudyDate?: Date;
  xp: number; // Experience points
  level: number;
  nextLevelXp: number; // XP needed for next level
  updatedAt: Date;
}

// Review log for analytics
export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: ReviewRating;
  responseTime: number; // in milliseconds
  timestamp: Date;
  wasCorrect: boolean;
}

// Analytics types
export interface DeckAnalytics {
  deckId: string;
  deckTitle: string;
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  retentionRate: number;
  averageEaseFactor: number;
  weakCards: string[]; // card IDs with low retention
}

export interface StudyEfficiency {
  score: number; // 0-100
  averageResponseTime: number;
  correctRate: number;
  consistencyScore: number;
  improvementTrend: number; // positive = improving
}

// Storage keys
export const STORAGE_KEYS = {
  DECKS: 'studyflow_decks',
  CARDS: 'studyflow_cards',
  REVIEWS: 'studyflow_reviews',
  REVIEW_LOGS: 'studyflow_review_logs',
  PROGRESS: 'studyflow_progress',
  DAILY_STATS: 'studyflow_daily_stats',
  DOCUMENTS: 'studyflow_documents',
  POMODORO_SETTINGS: 'studyflow_pomodoro_settings',
  POMODORO_SESSIONS: 'studyflow_pomodoro_sessions',
  QUIZZES: 'studyflow_quizzes',
  QUIZ_ATTEMPTS: 'studyflow_quiz_attempts',
  TASKS: 'studyflow_tasks',
  FOCUS_SESSIONS: 'studyflow_focus_sessions',
} as const;
