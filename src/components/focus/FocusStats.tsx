import React from 'react';
import { Brain, Zap, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFocusSessions } from '@/hooks/use-focus-sessions';
import { cn } from '@/lib/utils';

export function FocusStats() {
  const { todayStats, sessions } = useFocusSessions();

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const stats = [
    {
      icon: Brain,
      label: 'Focus Time',
      value: formatMinutes(todayStats.totalFocusMinutes),
      color: 'text-primary bg-primary/10',
    },
    {
      icon: Zap,
      label: 'Sessions',
      value: todayStats.sessionsCompleted.toString(),
      color: 'text-success bg-success/10',
    },
    {
      icon: AlertCircle,
      label: 'Interruptions',
      value: todayStats.interruptions.toString(),
      color: 'text-warning bg-warning/10',
    },
    {
      icon: TrendingUp,
      label: 'Avg Score',
      value: todayStats.averageFocusScore > 0 ? `${todayStats.averageFocusScore}%` : '-',
      color: todayStats.averageFocusScore > 0 
        ? `${getScoreColor(todayStats.averageFocusScore)} bg-muted`
        : 'text-muted-foreground bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg', stat.color.split(' ')[1])}>
                <stat.icon className={cn('h-4 w-4', stat.color.split(' ')[0])} />
              </div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
