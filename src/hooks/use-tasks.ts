import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, CreateTaskInput, UpdateTaskInput, TodaysPlan } from '@/types/tasks';
import { startOfDay, endOfDay, isToday, isBefore, parseISO } from 'date-fns';
import { getTasks, saveTask, deleteTask as deleteTaskFromStorage, generateId } from '@/lib/storage';

export function useTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    // We can show tasks even if not logged in (local mode), 
    // but the system was designed around userId. 
    // We'll filter by user.id if logged in, otherwise show all local ones?
    // Let's stick to the userId pattern for consistency.
    const allTasks = getTasks();
    const userTasks = user ? allTasks.filter(t => t.userId === user.id) : allTasks;
    setTasks(userTasks);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    // If we want it strictly "fully working", we allow guest tasks or require login.
    // The previous implementation required login.
    const userId = user?.id || 'guest';

    try {
      const maxPosition = tasks.length > 0
        ? Math.max(...tasks.map(t => t.position)) + 1
        : 0;

      const newTask: Task = {
        id: generateId(),
        userId,
        title: input.title.trim(),
        description: input.description?.trim(),
        tags: input.tags || [],
        estimateMinutes: input.estimateMinutes,
        dueAt: input.dueAt,
        priority: input.priority || 'medium',
        status: 'todo',
        deckId: input.deckId,
        position: maxPosition,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveTask(newTask);
      setTasks(prev => [...prev, newTask]);

      toast({
        title: 'Task created',
        description: input.title,
      });

      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Failed to create task',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, tasks, toast]);

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<boolean> => {
    try {
      const allTasks = getTasks();
      const taskIndex = allTasks.findIndex(t => t.id === id);

      if (taskIndex === -1) return false;

      const updatedTask: Task = {
        ...allTasks[taskIndex],
        ...input as any, // Cast because input types are slightly different
        updatedAt: new Date(),
      };

      // Handle the Date objects properly if they come as strings from localstorage
      if (input.dueAt) updatedTask.dueAt = new Date(input.dueAt);

      saveTask(updatedTask);

      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Failed to update task',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      deleteTaskFromStorage(id);
      setTasks(prev => prev.filter(t => t.id !== id));

      toast({
        title: 'Task deleted',
      });

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Failed to delete task',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const completeTask = useCallback(async (id: string, actualMinutes?: number): Promise<boolean> => {
    return updateTask(id, {
      status: 'done',
      actualMinutes: actualMinutes
    });
  }, [updateTask]);

  // Get today's plan - tasks due today or overdue, sorted by priority
  const getTodaysPlan = useCallback((): TodaysPlan => {
    const today = new Date();
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

    const todaysTasks = tasks
      .filter(task => {
        if (task.status === 'done' || task.status === 'cancelled') return false;
        if (!task.dueAt) return false;

        const dueDate = new Date(task.dueAt);
        return isToday(dueDate) || isBefore(dueDate, startOfDay(today));
      })
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        if (a.dueAt && b.dueAt) {
          const aDate = new Date(a.dueAt);
          const bDate = new Date(b.dueAt);
          return aDate.getTime() - bDate.getTime();
        }
        return 0;
      });

    const totalEstimatedMinutes = todaysTasks.reduce((sum, t) => sum + (t.estimateMinutes || 0), 0);
    const completedTasks = tasks.filter(t =>
      t.status === 'done' &&
      t.updatedAt &&
      isToday(new Date(t.updatedAt))
    );
    const completedMinutes = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || t.estimateMinutes || 0), 0);

    return {
      tasks: todaysTasks,
      totalEstimatedMinutes,
      completedMinutes,
      completedTasks: completedTasks.length,
    };
  }, [tasks]);

  const getUpcomingTasks = useCallback((): Task[] => {
    const today = new Date();
    const todayEnd = endOfDay(today);

    return tasks
      .filter(task => {
        if (task.status === 'done' || task.status === 'cancelled') return false;
        if (!task.dueAt) return true;

        const dueDate = new Date(task.dueAt);
        return dueDate > todayEnd;
      })
      .sort((a, b) => {
        if (a.dueAt && b.dueAt) {
          const aDate = new Date(a.dueAt);
          const bDate = new Date(b.dueAt);
          return aDate.getTime() - bDate.getTime();
        }
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;
        return 0;
      });
  }, [tasks]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    getTodaysPlan,
    getUpcomingTasks,
    refreshTasks: fetchTasks,
  };
}
