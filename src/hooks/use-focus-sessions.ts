import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FocusSession, DistractionLog, SessionType } from '@/types/tasks';
import { startOfDay, endOfDay, isToday } from 'date-fns';
import { getFocusSessions, saveFocusSession, deleteFocusSession, generateId } from '@/lib/storage';

interface ActiveSession {
  session: FocusSession;
  startTime: Date;
  interruptions: number;
}

export function useFocusSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [todayStats, setTodayStats] = useState({
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    interruptions: 0,
    averageFocusScore: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = useCallback((allSessions: FocusSession[]) => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const todaySessions = allSessions.filter(s => {
      const date = new Date(s.startedAt);
      return date >= start && date <= end;
    });

    const completed = todaySessions.filter(s => s.endedAt && s.sessionType === 'focus');
    const totalMinutes = completed.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
    const totalInterruptions = completed.reduce((sum, s) => sum + s.interruptions, 0);
    const avgScore = completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.focusScore || 0), 0) / completed.length
      : 0;

    setSessions(todaySessions);
    setTodayStats({
      totalFocusMinutes: totalMinutes,
      sessionsCompleted: completed.length,
      interruptions: totalInterruptions,
      averageFocusScore: Math.round(avgScore),
    });
  }, []);

  const fetchTodaySessions = useCallback(() => {
    const allSessions = getFocusSessions();
    const userSessions = user ? allSessions.filter(s => s.userId === user.id) : allSessions;
    calculateStats(userSessions);
    setLoading(false);
  }, [user, calculateStats]);

  useEffect(() => {
    fetchTodaySessions();
  }, [fetchTodaySessions]);

  const startSession = useCallback(async (
    plannedMinutes: number,
    sessionType: SessionType = 'focus',
    taskId?: string
  ): Promise<FocusSession | null> => {
    const userId = user?.id || 'guest';

    try {
      const newSession: FocusSession = {
        id: generateId(),
        userId,
        taskId,
        startedAt: new Date(),
        plannedMinutes,
        interruptions: 0,
        sessionType,
        createdAt: new Date(),
      };

      saveFocusSession(newSession);

      setActiveSession({
        session: newSession,
        startTime: new Date(),
        interruptions: 0,
      });

      setSessions(prev => [newSession, ...prev]);

      return newSession;
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Failed to start session',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const endSession = useCallback(async (
    notes?: string
  ): Promise<boolean> => {
    if (!activeSession) return false;

    try {
      const endTime = new Date();
      const actualMinutes = Math.round(
        (endTime.getTime() - activeSession.startTime.getTime()) / 60000
      );

      const interruptionPenalty = activeSession.interruptions * 5;
      const focusScore = Math.max(0, Math.min(100, 100 - interruptionPenalty));

      const completedSession: FocusSession = {
        ...activeSession.session,
        endedAt: endTime,
        actualMinutes,
        interruptions: activeSession.interruptions,
        focusScore,
        notes,
      };

      saveFocusSession(completedSession);

      setActiveSession(null);
      fetchTodaySessions();

      if (activeSession.session.sessionType === 'focus') {
        toast({
          title: 'Focus session complete!',
          description: `${actualMinutes} minutes focused, score: ${focusScore}`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: 'Failed to end session',
        variant: 'destructive',
      });
      return false;
    }
  }, [activeSession, fetchTodaySessions, toast]);

  const logInterruption = useCallback(async (
    type: DistractionLog['distractionType'],
    description?: string,
    url?: string
  ): Promise<boolean> => {
    if (!activeSession) return false;

    // In local storage mode, we don't necessarily need a separate distraction_logs table 
    // unless we want to track every single one. For now, we increment the session count.

    setActiveSession(prev => prev ? {
      ...prev,
      interruptions: prev.interruptions + 1,
    } : null);

    return true;
  }, [activeSession]);

  const cancelSession = useCallback(async (): Promise<boolean> => {
    if (!activeSession) return false;

    try {
      deleteFocusSession(activeSession.session.id);
      setSessions(prev => prev.filter(s => s.id !== activeSession.session.id));
      setActiveSession(null);

      return true;
    } catch (error) {
      console.error('Error cancelling session:', error);
      return false;
    }
  }, [activeSession]);

  return {
    sessions,
    activeSession,
    todayStats,
    loading,
    startSession,
    endSession,
    logInterruption,
    cancelSession,
    refreshSessions: fetchTodaySessions,
  };
}
