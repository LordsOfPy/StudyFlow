import React from 'react';
import { Layout } from '@/components/Layout';
import { useAnalytics, RetentionDataPoint, WeakTopic } from '@/hooks/use-analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

function EfficiencyScore({ score, label }: { score: number; label: string }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-success';
    if (s >= 60) return 'text-primary';
    if (s >= 40) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <div className="text-center">
      <div className={cn('text-4xl font-bold font-display', getScoreColor(score))}>
        {score}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  variant = 'default'
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  variant?: 'default' | 'primary' | 'success' | 'accent';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            variant === 'primary' && 'bg-primary/10 text-primary',
            variant === 'success' && 'bg-success/10 text-success',
            variant === 'accent' && 'bg-accent/10 text-accent',
            variant === 'default' && 'bg-secondary text-secondary-foreground',
          )}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-semibold font-display">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RetentionChart({ data }: { data: RetentionDataPoint[] }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Retention Over Time</CardTitle>
        <CardDescription>Your memory retention rate over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                labelFormatter={formatDate}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="retention"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                name="Retention %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DeckBreakdownChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Card Progress</CardTitle>
        <CardDescription>Distribution of your card mastery levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WeakTopicsCard({ topics }: { topics: WeakTopic[] }) {
  if (topics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            Weak Topics
          </CardTitle>
          <CardDescription>Cards that need more practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success/50 mb-3" />
            <p className="text-muted-foreground">No weak topics detected!</p>
            <p className="text-sm text-muted-foreground/80">Keep up the great work.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent" />
          Weak Topics
        </CardTitle>
        <CardDescription>Cards with high failure rates that need attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topics.slice(0, 5).map((topic) => (
            <div key={topic.cardId} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{topic.question}</p>
                  <p className="text-xs text-muted-foreground">{topic.deckTitle}</p>
                </div>
                <span className="text-sm font-medium text-destructive ml-2">
                  {topic.failureRate}% fail
                </span>
              </div>
              <Progress value={100 - topic.failureRate} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StudyHeatmap({ data }: { data: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] }) {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-secondary';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/40';
      case 3: return 'bg-primary/70';
      case 4: return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  // Group by weeks (7 days each)
  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Study Activity</CardTitle>
        <CardDescription>Your study consistency over the last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors',
                    getLevelColor(day.level)
                  )}
                  title={`${day.date}: ${day.count} cards reviewed`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn('w-3 h-3 rounded-sm', getLevelColor(level))}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const {
    loading,
    deckAnalytics,
    studyEfficiency,
    retentionData,
    weakTopics,
    heatmapData,
    quizStats,
    totalMastered,
    totalLearning,
    overallRetention
  } = useAnalytics();

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const pieData = [
    { name: 'Mastered', value: totalMastered, color: 'hsl(var(--success))' },
    { name: 'Learning', value: totalLearning, color: 'hsl(var(--primary))' },
    { name: 'New', value: deckAnalytics.reduce((sum, d) => sum + d.newCards, 0), color: 'hsl(var(--muted))' },
  ].filter(d => d.value > 0);

  const hasData = deckAnalytics.some(d => d.totalCards > 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics</h1>
          <p className="text-muted-foreground">
            Track your learning progress and identify areas for improvement
          </p>
        </div>

        {!hasData ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Study Data Yet</h3>
              <p className="text-muted-foreground max-w-md">
                Start reviewing flashcards to see your analytics. We'll track your
                retention, identify weak topics, and calculate your study efficiency.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Efficiency Score */}
            {studyEfficiency && (
              <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent" />
                    Study Efficiency Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <EfficiencyScore score={studyEfficiency.score} label="Overall" />
                    <EfficiencyScore score={studyEfficiency.correctRate} label="Accuracy" />
                    <EfficiencyScore score={studyEfficiency.consistencyScore} label="Consistency" />
                    <div className="text-center">
                      <div className="text-4xl font-bold font-display text-muted-foreground">
                        {Math.round(studyEfficiency.averageResponseTime / 1000)}s
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Avg. Response</p>
                    </div>
                    <div className="text-center">
                      <div className={cn(
                        'text-4xl font-bold font-display flex items-center justify-center gap-1',
                        studyEfficiency.improvementTrend >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {studyEfficiency.improvementTrend >= 0 ? (
                          <TrendingUp className="h-6 w-6" />
                        ) : (
                          <TrendingDown className="h-6 w-6" />
                        )}
                        {Math.abs(studyEfficiency.improvementTrend)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Trend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Award}
                title="Mastered Cards"
                value={totalMastered}
                subtitle="21+ day interval"
                variant="success"
              />
              <StatCard
                icon={BookOpen}
                title="Learning"
                value={totalLearning}
                subtitle="In progress"
                variant="primary"
              />
              <StatCard
                icon={Target}
                title="Retention Rate"
                value={`${overallRetention}%`}
                subtitle="Overall accuracy"
                variant="accent"
              />
              <StatCard
                icon={Brain}
                title="Total Decks"
                value={deckAnalytics.length}
                subtitle="Active study sets"
              />
            </div>

            {/* Quiz Stats */}
            {quizStats && (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  icon={BrainCircuit}
                  title="Quiz Attempts"
                  value={quizStats.totalAttempts}
                  subtitle="Total quizzes taken"
                />
                <StatCard
                  icon={Target}
                  title="Avg. Quiz Score"
                  value={`${quizStats.averageScore}%`}
                  subtitle="Average performance"
                  variant="primary"
                />
                <StatCard
                  icon={Award}
                  title="Best Score"
                  value={`${quizStats.topScore}%`}
                  subtitle="Personal best"
                  variant="success"
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RetentionChart data={retentionData} />
              <DeckBreakdownChart data={pieData} />
            </div>

            {/* Heatmap */}
            <StudyHeatmap data={heatmapData} />

            {/* Weak Topics */}
            <WeakTopicsCard topics={weakTopics} />

            {/* Deck Details */}
            {deckAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deck Performance</CardTitle>
                  <CardDescription>Detailed breakdown by deck</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {deckAnalytics.map((deck) => (
                      <div key={deck.deckId} className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{deck.deckTitle}</h4>
                          <span className="text-sm text-muted-foreground">
                            {deck.totalCards} cards
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold text-success">{deck.masteredCards}</p>
                            <p className="text-xs text-muted-foreground">Mastered</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-primary">{deck.learningCards}</p>
                            <p className="text-xs text-muted-foreground">Learning</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">{deck.newCards}</p>
                            <p className="text-xs text-muted-foreground">New</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-accent">{deck.retentionRate}%</p>
                            <p className="text-xs text-muted-foreground">Retention</p>
                          </div>
                        </div>
                        <Progress
                          value={(deck.masteredCards / Math.max(1, deck.totalCards)) * 100}
                          className="h-2 mt-3"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
