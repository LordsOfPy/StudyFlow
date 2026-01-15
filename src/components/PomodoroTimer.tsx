import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Battery, Settings } from 'lucide-react';
import { usePomodoro } from '@/hooks/use-pomodoro';
import { Button } from '@/components/ui/button';
import { TimerMode } from '@/types/study';
import { cn } from '@/lib/utils';

const modeConfig: Record<TimerMode, { label: string; icon: React.ElementType; color: string }> = {
  focus: { label: 'Focus', icon: Brain, color: 'text-primary' },
  shortBreak: { label: 'Short Break', icon: Coffee, color: 'text-success' },
  longBreak: { label: 'Long Break', icon: Battery, color: 'text-info' },
};

interface PomodoroTimerProps {
  minimal?: boolean;
}

export function PomodoroTimer({ minimal = false }: PomodoroTimerProps) {
  const {
    mode,
    timeLeft,
    isRunning,
    sessionsCompleted,
    progress,
    toggle,
    reset,
    switchMode,
    formatTime,
  } = usePomodoro();

  const config = modeConfig[mode];
  const Icon = config.icon;

  if (minimal) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl font-bold font-display tracking-tight text-white drop-shadow-md">
           {formatTime(timeLeft)}
        </div>
        <div className="flex gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-white hover:bg-white/20"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
                variant={isRunning ? "secondary" : "default"}
                size="sm"
                onClick={toggle}
                className="w-24"
            >
                {isRunning ? "Pause" : "Start"}
            </Button>
        </div>
        <div className="flex gap-1 mt-2">
            {(Object.keys(modeConfig) as TimerMode[]).map((m) => (
               <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    mode === m ? "bg-white" : "bg-white/30 hover:bg-white/50"
                  )}
                  title={modeConfig[m].label}
               />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl mb-8">
        {(Object.keys(modeConfig) as TimerMode[]).map((m) => {
          const { label } = modeConfig[m];
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              disabled={isRunning}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground disabled:opacity-50'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Timer Display */}
      <div className="relative">
        {/* Progress Ring */}
        <div className="relative w-64 h-64 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Timer Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={cn('mb-2', config.color)}>
              <Icon className="h-8 w-8" />
            </div>
            <p className="text-5xl font-bold font-display tracking-tight">
              {formatTime(timeLeft)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={reset}
          disabled={!isRunning && progress === 0}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          variant="hero"
          size="xl"
          onClick={toggle}
          className={cn(
            'w-32',
            isRunning && 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start
            </>
          )}
        </Button>

        <Button variant="ghost" size="icon-lg">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Session Counter */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Sessions completed today:{' '}
          <span className="font-semibold text-foreground">{sessionsCompleted}</span>
        </p>
        <div className="flex justify-center gap-2 mt-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                i <= (sessionsCompleted % 4 || (sessionsCompleted > 0 ? 4 : 0))
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
