import { useState, useEffect, useCallback } from 'react';
import { TimerMode, PomodoroSettings } from '@/types/study';
import { getPomodoroSettings, savePomodoroSession, generateId, updateTodayStats, getTodayStats, getProgress, saveProgress, updateStreak } from '@/lib/storage';

export function usePomodoro() {
  const [settings, setSettings] = useState<PomodoroSettings>(getPomodoroSettings);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const getDuration = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case 'focus':
        return settings.focusDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [settings]);
  
  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    setIsRunning(false);
  }, [getDuration]);
  
  const completeSession = useCallback(() => {
    if (mode === 'focus') {
      // Save the session
      savePomodoroSession({
        id: generateId(),
        mode,
        duration: settings.focusDuration * 60,
        completedAt: new Date(),
      });
      
      // Update stats
      const todayStats = getTodayStats();
      updateTodayStats({
        sessionsCompleted: todayStats.sessionsCompleted + 1,
        studyTime: todayStats.studyTime + settings.focusDuration * 60,
      });
      
      // Update progress
      const progress = getProgress();
      progress.totalStudyTime += settings.focusDuration * 60;
      saveProgress(progress);
      
      // Update streak
      updateStreak();
      
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      // Determine next break type
      if (newSessionsCompleted % settings.sessionsUntilLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      // Break ended, back to focus
      switchMode('focus');
    }
  }, [mode, settings, sessionsCompleted, switchMode]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      completeSession();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, completeSession]);
  
  const toggle = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);
  
  const reset = useCallback(() => {
    setTimeLeft(getDuration(mode));
    setIsRunning(false);
  }, [getDuration, mode]);
  
  const updateSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    if (!isRunning) {
      setTimeLeft(newSettings[`${mode === 'focus' ? 'focus' : mode === 'shortBreak' ? 'shortBreak' : 'longBreak'}Duration`] * 60);
    }
  }, [isRunning, mode]);
  
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const progress = 1 - (timeLeft / getDuration(mode));
  
  return {
    mode,
    timeLeft,
    isRunning,
    sessionsCompleted,
    settings,
    progress,
    toggle,
    reset,
    switchMode,
    updateSettings,
    formatTime,
  };
}
