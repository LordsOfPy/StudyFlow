import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Timer, BarChart3, Sparkles, Brain, ListTodo, FileText, BrainCircuit, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SyncStatus } from '@/components/SyncStatus';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AITutor } from '@/components/ai/AITutor';
import { GamificationBar } from '@/components/gamification/GamificationBar';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Study Planner', href: '/tasks', icon: ListTodo },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Flashcards', href: '/flashcards', icon: BookOpen },
  { name: 'Quiz', href: '/quiz', icon: BrainCircuit },
  { name: 'Focus Timer', href: '/timer', icon: Timer },
  { name: 'Analytics', href: '/analytics', icon: Brain },
  { name: 'Study Live', href: '/live', icon: Tv },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold">StudyFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'gap-2',
                      isActive && 'bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <GamificationBar />
            <ThemeToggle />
            <SettingsDialog />
            <SyncStatus />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Global AI Tutor */}
      <AITutor />
    </div>
  );
}
