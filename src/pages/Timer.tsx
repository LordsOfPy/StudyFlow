import React from 'react';
import { Layout } from '@/components/Layout';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { getTodaySessions } from '@/lib/storage';
import { Clock, Target, Coffee, Brain, Volume2, Play, Pause } from 'lucide-react';
import { useNoise } from '@/hooks/use-noise';
import { Button } from '@/components/ui/button';

const tips = [
  {
    icon: Brain,
    title: 'Stay focused',
    description: 'Remove distractions and focus on one task during each session.',
  },
  {
    icon: Coffee,
    title: 'Take real breaks',
    description: 'Step away from your desk. Stretch, hydrate, rest your eyes.',
  },
  {
    icon: Target,
    title: 'Set clear goals',
    description: 'Know exactly what you want to accomplish before starting.',
  },
];

export default function TimerPage() {
  const todaySessions = getTodaySessions();
  const todayFocusTime = todaySessions
    .filter(s => s.mode === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold font-display mb-2">Focus Timer</h1>
          <p className="text-muted-foreground">
            Stay productive with the Pomodoro Technique
          </p>
        </div>

        {/* Timer */}
        <PomodoroTimer />

        {/* Today's Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {todaySessions.filter(s => s.mode === 'focus').length}
                </p>
                <p className="text-sm text-muted-foreground">Focus sessions today</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {Math.round(todayFocusTime / 60)}m
                </p>
                <p className="text-sm text-muted-foreground">Total focus time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-display">Tips for Better Focus</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {tips.map((tip) => (
              <div key={tip.title} className="card-elevated p-5">
                <tip.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-medium mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Focus Sounds */}
      <div className="card-elevated p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5" /> Focus Sounds
        </h3>
        <NoiseControl />
      </div>
    </Layout>
  );
}

function NoiseControl() {
  const { isPlaying, volume, setVolume, type, setType, toggle } = useNoise();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <Button
        variant={isPlaying ? "default" : "outline"}
        size="lg"
        className="w-full sm:w-auto min-w-[140px] gap-2"
        onClick={toggle}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        {isPlaying ? "Stop Noise" : "Play Noise"}
      </Button>

      <div className="flex bg-muted p-1 rounded-lg">
        {(['white', 'pink', 'brown'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${type === t ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-1 w-full sm:max-w-xs">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
