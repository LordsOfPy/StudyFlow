
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create decks table
CREATE TABLE public.decks (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  card_count INTEGER NOT NULL DEFAULT 0,
  due_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decks" ON public.decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own decks" ON public.decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own decks" ON public.decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own decks" ON public.decks FOR DELETE USING (auth.uid() = user_id);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Create flashcard_reviews table
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.flashcards ON DELETE CASCADE,
  ease_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews" ON public.flashcard_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.flashcard_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.flashcard_reviews FOR DELETE USING (auth.uid() = user_id);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  total_cards_reviewed INTEGER NOT NULL DEFAULT 0,
  total_study_time INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create daily_stats table
CREATE TABLE public.daily_stats (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  cards_reviewed INTEGER NOT NULL DEFAULT 0,
  cards_learned INTEGER NOT NULL DEFAULT 0,
  study_time INTEGER NOT NULL DEFAULT 0,
  accuracy DOUBLE PRECISION NOT NULL DEFAULT 0,
  pomodoros_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily stats" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own daily stats" ON public.daily_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily stats" ON public.daily_stats FOR UPDATE USING (auth.uid() = user_id);

-- Create review_logs table
CREATE TABLE public.review_logs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.flashcards ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks ON DELETE CASCADE,
  rating TEXT NOT NULL,
  response_time INTEGER NOT NULL DEFAULT 0,
  was_correct BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own review logs" ON public.review_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own review logs" ON public.review_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create pomodoro_sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pomodoro sessions" ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own pomodoro sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON public.decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flashcard_reviews_updated_at BEFORE UPDATE ON public.flashcard_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.daily_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
