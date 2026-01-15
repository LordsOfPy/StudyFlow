import React from 'react';
import { Flame, BookOpen, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { useProgress } from '@/hooks/use-progress';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success';
}

function StatCard({ icon: Icon, label, value, subtext, variant = 'default' }: StatCardProps) {
  return (
    <div className="card-interactive p-5">
      <div className="flex items-start justify-between">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          variant === 'primary' && 'bg-primary/10 text-primary',
          variant === 'accent' && 'bg-accent/10 text-accent',
          variant === 'success' && 'bg-success/10 text-success',
          variant === 'default' && 'bg-secondary text-secondary-foreground',
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold font-display">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtext && (
          <p className="mt-1 text-xs text-muted-foreground/80">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const isActive = streak > 0;
  
  return (
    <div className={cn(
      'card-interactive p-6 relative overflow-hidden',
      isActive && 'bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20'
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl',
          isActive 
            ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-lg' 
            : 'bg-muted text-muted-foreground'
        )}>
          <Flame className="h-8 w-8" />
        </div>
        <div>
          <p className="text-4xl font-bold font-display">{streak}</p>
          <p className="text-sm text-muted-foreground">
            {streak === 1 ? 'day streak' : 'day streak'}
          </p>
        </div>
      </div>
      {isActive && (
        <p className="mt-4 text-sm text-accent font-medium">
          🔥 Keep it going! Study today to maintain your streak.
        </p>
      )}
      {!isActive && (
        <p className="mt-4 text-sm text-muted-foreground">
          Start studying to build your streak!
        </p>
      )}
    </div>
  );
}

export function ProgressDashboard() {
  const { progress, todayStats, todaySessions, weeklyAverage, totalStudyHours, loading } = useProgress();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak Banner */}
      <StreakBadge streak={progress?.currentStreak || 0} />

      {/* Today's Stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Today</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Cards Reviewed"
            value={todayStats?.cardsReviewed || 0}
            variant="primary"
          />
          <StatCard
            icon={Target}
            label="New Cards Learned"
            value={todayStats?.cardsLearned || 0}
            variant="success"
          />
          <StatCard
            icon={Zap}
            label="Focus Sessions"
            value={todaySessions}
            variant="accent"
          />
          <StatCard
            icon={Clock}
            label="Study Time"
            value={`${Math.round((todayStats?.studyTime || 0) / 60)}m`}
          />
        </div>
      </div>

      {/* Overall Progress */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">All Time</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={BookOpen}
            label="Total Cards Reviewed"
            value={progress?.totalCardsReviewed.toLocaleString() || 0}
          />
          <StatCard
            icon={Clock}
            label="Study Hours"
            value={`${totalStudyHours}h`}
          />
          <StatCard
            icon={TrendingUp}
            label="Weekly Average"
            value={`${weeklyAverage} cards`}
            subtext="per day"
          />
        </div>
      </div>
    </div>
  );
}
