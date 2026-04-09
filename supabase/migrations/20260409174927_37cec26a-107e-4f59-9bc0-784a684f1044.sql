
-- Student fitness profiles (configured by trainer during onboarding)
CREATE TABLE public.student_fitness_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  trainer_id UUID NOT NULL,
  objective TEXT NOT NULL DEFAULT 'general',
  level TEXT NOT NULL DEFAULT 'beginner',
  training_location TEXT NOT NULL DEFAULT 'gym',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_fitness_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage their students fitness profiles"
ON public.student_fitness_profiles FOR ALL
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Students can read own fitness profile"
ON public.student_fitness_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_student_fitness_profiles_updated_at
BEFORE UPDATE ON public.student_fitness_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User streaks for gamification
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_workouts INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streaks"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streaks"
ON public.user_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
ON public.user_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Trainers can view their students streaks
CREATE POLICY "Trainers can read student streaks"
ON public.user_streaks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_streaks.user_id
    AND p.trainer_id = auth.uid()
  )
);

-- Badges catalog
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'achievement',
  requirement_type TEXT NOT NULL DEFAULT 'streak',
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
ON public.badges FOR SELECT
USING (true);

-- User badges (earned)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trainers can see student badges
CREATE POLICY "Trainers can read student badges"
ON public.user_badges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_badges.user_id
    AND p.trainer_id = auth.uid()
  )
);

-- Add invite_slug to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_slug TEXT UNIQUE;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value) VALUES
('Primeiro Treino', 'Completou seu primeiro treino', '💪', 'milestone', 'total_workouts', 1),
('Semana Completa', '7 dias seguidos de treino', '🔥', 'streak', 'streak', 7),
('Mês de Ferro', '30 dias seguidos de treino', '⚡', 'streak', 'streak', 30),
('Dedicação', '10 treinos completados', '🎯', 'milestone', 'total_workouts', 10),
('Veterano', '50 treinos completados', '🏆', 'milestone', 'total_workouts', 50),
('Centurião', '100 treinos completados', '👑', 'milestone', 'total_workouts', 100),
('Consistência', '3 dias seguidos', '✨', 'streak', 'streak', 3),
('Imparável', '14 dias seguidos', '🚀', 'streak', 'streak', 14);
