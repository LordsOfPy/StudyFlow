import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { TodaysPlan } from '@/components/tasks/TodaysPlan';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { FocusStats } from '@/components/focus/FocusStats';
import { Task } from '@/types/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn, ListTodo, Timer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Tasks() {
  const { user } = useAuth();
  const [focusTask, setFocusTask] = useState<Task | undefined>();
  const [activeTab, setActiveTab] = useState('plan');

  const handleStartFocus = (task: Task) => {
    setFocusTask(task);
    setActiveTab('focus');
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <ListTodo className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Sign in to manage tasks</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create tasks, plan your day, and track your focus sessions with cloud sync.
          </p>
          <Link to="/auth">
            <Button variant="hero" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Study Planner</h1>
            <p className="text-muted-foreground">Plan your day and stay focused</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="plan" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Today's Plan
            </TabsTrigger>
            <TabsTrigger value="focus" className="gap-2">
              <Timer className="h-4 w-4" />
              Focus Timer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-6">
            <TodaysPlan onStartFocus={handleStartFocus} />
          </TabsContent>

          <TabsContent value="focus" className="mt-6 space-y-6">
            <FocusStats />
            <FocusTimer 
              linkedTask={focusTask} 
              onComplete={() => setFocusTask(undefined)} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
