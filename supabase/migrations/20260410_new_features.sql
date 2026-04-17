-- ============================================================
-- Migration: Treinos, Progresso e Pagamentos
-- Data: 2026-04-10
-- ============================================================

-- 1. exercises — biblioteca de exercícios
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL DEFAULT 'Geral',
  description text,
  instructions text,
  video_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. workout_plans — fichas de treino
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. workout_exercises — exercícios dentro de uma ficha
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  sets integer DEFAULT 3,
  reps text DEFAULT '12',
  load_kg numeric,
  rest_seconds integer DEFAULT 60,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. workout_executions — histórico de execuções do aluno
CREATE TABLE IF NOT EXISTS public.workout_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  completed_at timestamptz DEFAULT now(),
  feedback_energy integer CHECK (feedback_energy BETWEEN 1 AND 5),
  feedback_muscle_pain integer CHECK (feedback_muscle_pain BETWEEN 1 AND 5),
  feedback_sleep_quality integer CHECK (feedback_sleep_quality BETWEEN 1 AND 5),
  feedback_notes text,
  duration_minutes integer
);

-- 5. body_measurements — medidas corporais e peso
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at date DEFAULT current_date,
  weight_kg numeric,
  height_cm numeric,
  body_fat_pct numeric,
  chest_cm numeric,
  waist_cm numeric,
  hip_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  calf_cm numeric,
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 6. payment_plans — planos de pagamento oferecidos pelo personal
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  sessions_per_month integer,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. payments — registros de pagamento por aluno
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  reference_month text, -- ex: "2026-04"
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- exercises: todos autenticados podem ver
CREATE POLICY "exercises_select" ON public.exercises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exercises_insert" ON public.exercises
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "exercises_update" ON public.exercises
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- workout_plans: trainer ou aluno da ficha
CREATE POLICY "workout_plans_select" ON public.workout_plans
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "workout_plans_insert" ON public.workout_plans
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "workout_plans_update" ON public.workout_plans
  FOR UPDATE TO authenticated USING (trainer_id = auth.uid());

CREATE POLICY "workout_plans_delete" ON public.workout_plans
  FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- workout_exercises: quem pode ver a ficha
CREATE POLICY "workout_exercises_select" ON public.workout_exercises
  FOR SELECT TO authenticated USING (
    workout_plan_id IN (
      SELECT id FROM public.workout_plans
      WHERE trainer_id = auth.uid() OR student_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_insert" ON public.workout_exercises
  FOR INSERT TO authenticated WITH CHECK (
    workout_plan_id IN (
      SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_update" ON public.workout_exercises
  FOR UPDATE TO authenticated USING (
    workout_plan_id IN (
      SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "workout_exercises_delete" ON public.workout_exercises
  FOR DELETE TO authenticated USING (
    workout_plan_id IN (
      SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()
    )
  );

-- workout_executions: aluno registra, trainer visualiza
CREATE POLICY "workout_executions_select" ON public.workout_executions
  FOR SELECT TO authenticated USING (
    student_id = auth.uid() OR
    workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid())
  );

CREATE POLICY "workout_executions_insert" ON public.workout_executions
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- body_measurements: trainer insere, ambos veem
CREATE POLICY "body_measurements_select" ON public.body_measurements
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "body_measurements_insert" ON public.body_measurements
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "body_measurements_update" ON public.body_measurements
  FOR UPDATE TO authenticated USING (trainer_id = auth.uid());

CREATE POLICY "body_measurements_delete" ON public.body_measurements
  FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- payment_plans: trainer gerencia
CREATE POLICY "payment_plans_select" ON public.payment_plans
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid());

CREATE POLICY "payment_plans_insert" ON public.payment_plans
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "payment_plans_update" ON public.payment_plans
  FOR UPDATE TO authenticated USING (trainer_id = auth.uid());

-- payments: trainer e aluno relevante
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE TO authenticated USING (trainer_id = auth.uid());

-- ============================================================
-- Exercícios padrão (biblioteca base)
-- ============================================================
INSERT INTO public.exercises (name, muscle_group, description, is_default) VALUES
  ('Supino Reto', 'Peito', 'Exercício básico para desenvolvomento do peitoral maior', true),
  ('Supino Inclinado', 'Peito', 'Variação do supino com ênfase na parte superior do peitoral', true),
  ('Crucifixo', 'Peito', 'Isolador de peitoral com halteres', true),
  ('Pulldown (Puxada Alta)', 'Costas', 'Puxada na polia alta para desenvolvimento do latíssimo', true),
  ('Remada Curvada', 'Costas', 'Remada com barra para massa de costas', true),
  ('Remada Cavalinho', 'Costas', 'Remada unilateral com halter', true),
  ('Agachamento Livre', 'Pernas', 'Exercício fundamental para quadríceps e glúteos', true),
  ('Leg Press', 'Pernas', 'Prensa para quadríceps, isquiotibiais e glúteos', true),
  ('Cadeira Extensora', 'Pernas', 'Isolador de quadríceps', true),
  ('Cadeira Flexora', 'Pernas', 'Isolador de isquiotibiais', true),
  ('Elevação Pélvica', 'Glúteos', 'Hip thrust para desenvolvimento dos glúteos', true),
  ('Desenvolvimento com Halteres', 'Ombros', 'Press militar com halteres para deltoides', true),
  ('Elevação Lateral', 'Ombros', 'Isolador de deltoide lateral', true),
  ('Rosca Direta', 'Bíceps', 'Curl com barra para bíceps', true),
  ('Rosca Alternada', 'Bíceps', 'Curl alternado com halteres', true),
  ('Tríceps Pulley', 'Tríceps', 'Extensão de tríceps na polia', true),
  ('Mergulho (Dips)', 'Tríceps', 'Exercício de peso corporal para tríceps e peitorais', true),
  ('Prancha', 'Abdômen', 'Estabilização isométrica do core', true),
  ('Abdominal Crunch', 'Abdômen', 'Flexão de tronco para reto abdominal', true),
  ('Panturrilha em Pé', 'Panturrilha', 'Elevação de panturrilha para gastrocnêmio', true),
  ('Corrida', 'Cardio', 'Corrida em esteira ou ao ar livre', true),
  ('Bicicleta Ergométrica', 'Cardio', 'Cardio de baixo impacto na bike', true),
  ('Burpee', 'Funcional', 'Exercício funcional de corpo inteiro', true),
  ('Flexão de Braço', 'Peito', 'Push-up para peitoral e tríceps', true),
  ('Barra Fixa', 'Costas', 'Pull-up no peso corporal', true)
ON CONFLICT DO NOTHING;
