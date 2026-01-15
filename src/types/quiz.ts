export type QuestionType = 'multiple_choice' | 'true_false' | 'open_ended';

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | boolean; // For auto-grading
  explanation?: string; // Shown after answering
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subjectId?: string; // specific subject/folder
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  isAiGenerated: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score: number;
  maxScore: number;
  answers: Record<string, string | boolean>; // questionId -> answer
}
