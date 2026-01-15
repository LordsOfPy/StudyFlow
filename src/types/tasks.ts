// Task types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  estimateMinutes?: number;
  actualMinutes?: number;
  dueAt?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  deckId?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  tags?: string[];
  estimateMinutes?: number;
  dueAt?: Date;
  priority?: TaskPriority;
  deckId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  tags?: string[];
  estimateMinutes?: number;
  actualMinutes?: number;
  dueAt?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  deckId?: string;
  position?: number;
}

// Focus Session types
export type SessionType = 'focus' | 'short_break' | 'long_break';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  startedAt: Date;
  endedAt?: Date;
  plannedMinutes: number;
  actualMinutes?: number;
  interruptions: number;
  focusScore?: number;
  sessionType: SessionType;
  notes?: string;
  createdAt: Date;
}

export interface DistractionLog {
  id: string;
  userId: string;
  sessionId: string;
  distractionType: 'tab_switch' | 'app_switch' | 'manual' | 'notification';
  description?: string;
  url?: string;
  durationSeconds?: number;
  timestamp: Date;
}

// Today's Plan types
export interface TodaysPlan {
  tasks: Task[];
  totalEstimatedMinutes: number;
  completedMinutes: number;
  completedTasks: number;
}
