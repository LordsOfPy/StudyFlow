import React from 'react';
import { Layout } from '@/components/Layout';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Timer, Sparkles, ArrowRight, Zap, Brain, BarChart3, ListTodo, FileText, Target } from 'lucide-react';
import { TodaysPlan } from '@/components/tasks/TodaysPlan';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: ListTodo,
    title: 'Study Planner',
    description: 'Plan your day, set priorities, and track task completion.',
    href: '/tasks',
    color: 'text-accent bg-accent/10',
  },
  {
    icon: FileText,
    title: 'Notes & Knowledge',
    description: 'Markdown notes with backlinks and folder organization.',
    href: '/notes',
    color: 'text-warning bg-warning/10',
  },
  {
    icon: BookOpen,
    title: 'Smart Flashcards',
    description: 'Create and study with spaced repetition for long-term memory.',
    href: '/flashcards',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    description: 'Stay productive with Pomodoro sessions and break reminders.',
    href: '/timer',
    color: 'text-success bg-success/10',
  },
  {
    icon: Brain,
    title: 'AI Usage',
    description: 'Generate quizzes and flashcards from your notes instantly.',
    href: '/quiz',
    color: 'text-purple-500 bg-purple-500/10',
  },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-12">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Study smarter, not harder</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Welcome to StudyFlow
            </h1>
            <p className="text-muted-foreground max-w-lg mb-6">
              Master any subject with proven learning techniques. Plan your study sessions,
              take smart notes, and achieve your learning goals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/tasks">
                <Button variant="hero" size="lg" className="gap-2">
                  <Target className="h-4 w-4" />
                  Plan Your Day
                </Button>
              </Link>
              <Link to="/notes">
                <Button variant="outline" size="lg" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Take Notes
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Today's Plan Preview (for logged in users) */}
        {user && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-accent" />
                Today's Plan
              </h2>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="gap-2">
                  View Full Planner
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <TodaysPlan compact />
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold font-display mb-4">Study Tools</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link key={feature.title} to={feature.href}>
                <div className="card-interactive p-6 h-full">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Progress Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display">Your Progress</h2>
            <Link to="/analytics">
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Details
              </Button>
            </Link>
          </div>
          <ProgressDashboard />
        </section>

        {/* Donation/Support Section (app is free) */}
        <div className="card-elevated p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Support StudyFlow</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  StudyFlow is 100% free. If you find it helpful, consider supporting development.
                </p>
              </div>
            </div>
            <Button variant="accent" size="sm">
              Donate
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}