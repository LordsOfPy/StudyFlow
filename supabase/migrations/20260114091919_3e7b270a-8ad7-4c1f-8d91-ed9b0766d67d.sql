-- Study OS: Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  estimate_minutes INTEGER,
  actual_minutes INTEGER,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  deck_id UUID REFERENCES public.decks(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Focus Control: Focus sessions table
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER,
  interruptions INTEGER DEFAULT 0,
  focus_score NUMERIC,
  session_type TEXT DEFAULT 'focus' CHECK (session_type IN ('focus', 'short_break', 'long_break')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Focus Control: Distraction logs table
CREATE TABLE public.distraction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
  distraction_type TEXT CHECK (distraction_type IN ('tab_switch', 'app_switch', 'manual', 'notification')),
  description TEXT,
  url TEXT,
  duration_seconds INTEGER,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distraction_logs ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies
CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

-- Focus sessions RLS policies
CREATE POLICY "Users can view their own focus sessions"
ON public.focus_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own focus sessions"
ON public.focus_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
ON public.focus_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions"
ON public.focus_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Distraction logs RLS policies
CREATE POLICY "Users can view their own distraction logs"
ON public.distraction_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own distraction logs"
ON public.distraction_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own distraction logs"
ON public.distraction_logs FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_due_at ON public.tasks(due_at);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_task_id ON public.focus_sessions(task_id);
CREATE INDEX idx_distraction_logs_session_id ON public.distraction_logs(session_id);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();