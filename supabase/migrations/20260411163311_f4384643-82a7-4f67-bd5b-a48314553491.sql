
-- ═══ EXERCISES ═══
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL DEFAULT 'Geral',
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trainers can manage exercises" ON public.exercises FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'trainer'))
  WITH CHECK (has_role(auth.uid(), 'trainer'));

-- ═══ WORKOUT PLANS ═══
CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  student_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers manage own plans" ON public.workout_plans FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "Students read own plans" ON public.workout_plans FOR SELECT TO authenticated
  USING (auth.uid() = student_id);
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══ WORKOUT EXERCISES ═══
CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.exercises(id),
  exercise_name text NOT NULL,
  sets integer DEFAULT 3,
  reps text DEFAULT '12',
  load_kg numeric,
  rest_seconds integer DEFAULT 60,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers manage workout exercises" ON public.workout_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_id AND wp.trainer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_id AND wp.trainer_id = auth.uid()));
CREATE POLICY "Students read own workout exercises" ON public.workout_exercises FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_id AND wp.student_id = auth.uid()));

-- ═══ WORKOUT EXECUTIONS ═══
CREATE TABLE public.workout_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid REFERENCES public.workout_plans(id),
  student_id uuid NOT NULL,
  session_id uuid REFERENCES public.sessions(id),
  feedback_energy integer,
  feedback_muscle_pain integer,
  feedback_sleep_quality integer,
  feedback_notes text,
  duration_minutes integer,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own executions" ON public.workout_executions FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Trainers read student executions" ON public.workout_executions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = student_id AND p.trainer_id = auth.uid()));

-- ═══ AVATARS BUCKET ═══
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');
