import { useState, useEffect, useCallback } from 'react';
import { UserProgress, DailyStats } from '@/types/study';
import { getProgress, getDailyStats, getTodayStats, getTodaySessions } from '@/lib/storage';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [todaySessions, setTodaySessions] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setProgress(getProgress());
    setDailyStats(getDailyStats());
    setTodayStats(getTodayStats());
    setTodaySessions(getTodaySessions().length);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Calculate weekly average
  const weeklyAverage = dailyStats.length > 0
    ? Math.round(dailyStats.slice(-7).reduce((sum, day) => sum + day.cardsReviewed, 0) / Math.min(7, dailyStats.length))
    : 0;

  // Calculate total study hours
  const totalStudyHours = progress
    ? Math.round((progress.totalStudyTime / 3600) * 10) / 10
    : 0;

  return {
    progress,
    dailyStats,
    todayStats,
    todaySessions,
    weeklyAverage,
    totalStudyHours,
    loading,
    refresh,
  };
}
