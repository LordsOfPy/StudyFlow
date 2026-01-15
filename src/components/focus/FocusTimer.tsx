import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Coffee, Brain, Battery, 
  Settings, Target, AlertCircle, X, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFocusSessions } from '@/hooks/use-focus-sessions';
import { useTasks } from '@/hooks/use-tasks';
import { Task, SessionType } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';

interface FocusTimerProps {
  linkedTask?: Task;
  onComplete?: () => void;
}

const sessionConfig: Record<SessionType, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  defaultMinutes: number;
}> = {
  focus: { label: 'Focus', icon: Brain, color: 'text-primary', defaultMinutes: 25 },
  short_break: { label: 'Short Break', icon: Coffee, color: 'text-success', defaultMinutes: 5 },
  long_break: { label: 'Long Break', icon: Battery, color: 'text-info', defaultMinutes: 15 },
};

export function FocusTimer({ linkedTask, onComplete }: FocusTimerProps) {
  const { startSession, endSession, logInterruption, cancelSession, activeSession, todayStats } = useFocusSessions();
  const { tasks, completeTask } = useTasks();
  const { toast } = useToast();

  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(linkedTask);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const config = sessionConfig[sessionType];
  const Icon = config.icon;

  // Sync with activeSession
  useEffect(() => {
    if (activeSession) {
      const elapsed = Math.floor(
        (Date.now() - activeSession.startTime.getTime()) / 1000
      );
      const remaining = activeSession.session.plannedMinutes * 60 - elapsed;
      setTimeLeft(Math.max(0, remaining));
      setIsRunning(true);
    }
  }, [activeSession]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleSessionEnd = async () => {
    if (activeSession) {
      setShowCompleteDialog(true);
    }
  };

  const handleCompleteSession = async (markTaskDone: boolean) => {
    await endSession(sessionNotes);
    
    if (markTaskDone && selectedTask) {
      await completeTask(selectedTask.id, duration);
    }

    setShowCompleteDialog(false);
    setSessionNotes('');
    
    // Auto-switch to break
    if (sessionType === 'focus') {
      const nextType = todayStats.sessionsCompleted % 4 === 3 ? 'long_break' : 'short_break';
      switchMode(nextType);
    } else {
      switchMode('focus');
    }

    onComplete?.();
  };

  const switchMode = useCallback((newType: SessionType) => {
    setSessionType(newType);
    setDuration(sessionConfig[newType].defaultMinutes);
    setTimeLeft(sessionConfig[newType].defaultMinutes * 60);
    setIsRunning(false);
  }, []);

  const toggle = async () => {
    if (!isRunning) {
      // Start session
      const session = await startSession(duration, sessionType, selectedTask?.id);
      if (session) {
        setIsRunning(true);
      }
    } else {
      // Pause - log as interruption
      await logInterruption('manual', 'Paused session');
      setIsRunning(false);
    }
  };

  const reset = async () => {
    if (activeSession) {
      await cancelSession();
    }
    setTimeLeft(duration * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / (duration * 60));
  const incompleteTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');

  return (
    <>
      <div className="max-w-md mx-auto">
        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
          {(Object.keys(sessionConfig) as SessionType[]).map((type) => {
            const { label } = sessionConfig[type];
            const isActive = sessionType === type;
            return (
              <button
                key={type}
                onClick={() => !isRunning && switchMode(type)}
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

        {/* Task Selector */}
        {sessionType === 'focus' && !isRunning && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Focus on task</span>
              </div>
              <Select
                value={selectedTask?.id || ''}
                onValueChange={(id) => setSelectedTask(tasks.find(t => t.id === id))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {incompleteTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{task.title}</span>
                        {task.estimateMinutes && (
                          <Badge variant="secondary" className="text-xs">
                            {task.estimateMinutes}m
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Linked Task Display */}
        {selectedTask && isRunning && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium truncate">{selectedTask.title}</span>
            {activeSession && activeSession.interruptions > 0 && (
              <Badge variant="outline" className="text-warning ml-auto">
                <AlertCircle className="h-3 w-3 mr-1" />
                {activeSession.interruptions}
              </Badge>
            )}
          </div>
        )}

        {/* Timer Display */}
        <div className="relative">
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="4"
              />
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
            <span className="font-semibold text-foreground">{todayStats.sessionsCompleted}</span>
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  i <= (todayStats.sessionsCompleted % 4 || (todayStats.sessionsCompleted > 0 ? 4 : 0))
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Session Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Session Complete!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Great job! You focused for {duration} minutes
              {activeSession && activeSession.interruptions > 0 && (
                <> with {activeSession.interruptions} interruption{activeSession.interruptions > 1 ? 's' : ''}</>
              )}.
            </p>

            <div>
              <label className="text-sm font-medium">Session Notes (optional)</label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you accomplish?"
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => handleCompleteSession(false)}>
              Done
            </Button>
            {selectedTask && (
              <Button onClick={() => handleCompleteSession(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Task Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
