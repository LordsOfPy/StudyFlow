import React from 'react';
import { CalendarDays, Clock, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TaskList } from './TaskList';
import { useTasks } from '@/hooks/use-tasks';
import { useFocusSessions } from '@/hooks/use-focus-sessions';
import { Task, TodaysPlan as TodaysPlanType } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface TodaysPlanProps {
  onStartFocus?: (task: Task) => void;
  compact?: boolean;
}

export function TodaysPlan({ onStartFocus, compact }: TodaysPlanProps) {
  const { tasks, loading, getTodaysPlan, getUpcomingTasks } = useTasks();
  const { todayStats } = useFocusSessions();

  const plan = getTodaysPlan();
  const upcomingTasks = getUpcomingTasks().slice(0, 3);

  const completedPercentage = plan.tasks.length > 0
    ? Math.round((plan.completedTasks / (plan.tasks.length + plan.completedTasks)) * 100)
    : 0;

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tasks today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/5 to-transparent border-info/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatMinutes(plan.totalEstimatedMinutes)}</p>
                <p className="text-xs text-muted-foreground">Estimated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/5 to-transparent border-warning/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStats.sessionsCompleted}</p>
                <p className="text-xs text-muted-foreground">Focus sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {(plan.tasks.length > 0 || plan.completedTasks > 0) && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-sm text-muted-foreground">{completedPercentage}%</span>
            </div>
            <Progress value={completedPercentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today's Tasks
            {plan.tasks.some(t => t.priority === 'urgent') && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={plan.tasks}
            loading={loading}
            showComposer={true}
            onStartFocus={onStartFocus}
            emptyMessage="No tasks due today. Add one above!"
          />
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Coming Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={upcomingTasks}
              loading={loading}
              showComposer={false}
              onStartFocus={onStartFocus}
              compact={true}
              emptyMessage=""
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
