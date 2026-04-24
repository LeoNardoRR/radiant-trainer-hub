-- ============================================================
-- FITTRACKER — SQL DEFINITIVO PARA COLAR NO SUPABASE SQL EDITOR
-- Execute TUDO de uma vez. Seguro para re-executar.
-- ============================================================

-- ── 0. Pré-requisitos de tipo (só cria se não existir) ────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('trainer', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FUNÇÃO has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role text)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  );
END; $$;

DO $$ BEGIN
  CREATE TYPE public.session_status AS ENUM ('pending','approved','rejected','cancelled','completed','missed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('active','inactive','at_risk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 1. user_roles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ── 2. profiles ───────────────────────────────────────────────
-- (tabela principal — usada em TODOS os hooks)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  phone       text,
  specialty   text,
  avatar_url  text,
  bio         text,
  trainer_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status      student_status NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Colunas que podem ter sido adicionadas depois (idempotente)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio        text;

-- ── 3. availability ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.availability (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week  int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- ── 4. sessions ───────────────────────────────────────────────
-- Colunas usadas em useSessions.ts:
-- trainer_id, student_id, date, start_time, end_time, status,
-- session_type, notes, trainer_notes, original_session_id,
-- makeup_deadline, suggested_date, suggested_start_time
CREATE TABLE IF NOT EXISTS public.sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  start_time            time NOT NULL,
  end_time              time NOT NULL,
  status                session_status NOT NULL DEFAULT 'pending',
  session_type          text,
  notes                 text,
  trainer_notes         text,
  original_session_id   uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  makeup_deadline       date,               -- usado em useSessions & useMakeupSessions
  suggested_date        date,
  suggested_start_time  time,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS makeup_deadline     date;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS original_session_id uuid;

-- ── 5. notifications ─────────────────────────────────────────
-- Colunas usadas (useNotifications, useSessions, usePayments):
-- user_id, title, message, type, is_read, data (jsonb), created_at
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  message    text,
  type       text NOT NULL DEFAULT 'system',
  is_read    boolean NOT NULL DEFAULT false,
  data       jsonb,          -- alias para metadata (useNotifications usa "data")
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data     jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message  text;

-- ── 6. messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ── 7. trainer_settings ───────────────────────────────────────
-- Colunas usadas em useSessions (makeup_days_limit):
CREATE TABLE IF NOT EXISTS public.trainer_settings (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id                      uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  session_duration                int NOT NULL DEFAULT 60,
  break_between                   int NOT NULL DEFAULT 15,
  cancel_limit_hours              int NOT NULL DEFAULT 2,
  max_sessions_per_day            int NOT NULL DEFAULT 8,
  retention_alert_days_light      int NOT NULL DEFAULT 3,
  retention_alert_days_moderate   int NOT NULL DEFAULT 5,
  retention_alert_days_critical   int NOT NULL DEFAULT 7,
  reminder_hours_before           int NOT NULL DEFAULT 2,
  makeup_days_limit               int NOT NULL DEFAULT 7,   -- coluna crítica
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trainer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_settings ADD COLUMN IF NOT EXISTS makeup_days_limit int NOT NULL DEFAULT 7;

-- ── 8. exercises ─────────────────────────────────────────────
-- Colunas: name, muscle_group, description, is_default, created_by
CREATE TABLE IF NOT EXISTS public.exercises (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  muscle_group text NOT NULL DEFAULT 'Geral',
  description  text,
  instructions text,
  video_url    text,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_default   boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- ── 9. workout_plans ─────────────────────────────────────────
-- Colunas: trainer_id, student_id, name, description, is_active
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- ── 10. workout_exercises ─────────────────────────────────────
-- Colunas usadas pelo useWorkouts.ts (useAddWorkoutExercise):
-- workout_plan_id, exercise_id, exercise_name, sets, reps,
-- load_kg, rest_seconds, notes, order_index
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id  uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id      uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name    text NOT NULL,
  sets             integer DEFAULT 3,
  reps             text DEFAULT '12',
  load_kg          numeric,
  rest_seconds     integer DEFAULT 60,
  notes            text,
  technical_notes  text,
  order_index      integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- ── 11. workout_executions ────────────────────────────────────
-- Colunas usadas por useLogWorkoutExecution & useWorkoutExecutions:
-- workout_plan_id, student_id, session_id, completed_at,
-- feedback_energy, feedback_muscle_pain, feedback_sleep_quality,
-- feedback_notes, duration_minutes
CREATE TABLE IF NOT EXISTS public.workout_executions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id        uuid REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  student_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id             uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  completed_at           timestamptz DEFAULT now(),
  feedback_energy        integer CHECK (feedback_energy BETWEEN 1 AND 5),
  feedback_muscle_pain   integer CHECK (feedback_muscle_pain BETWEEN 1 AND 5),
  feedback_sleep_quality integer CHECK (feedback_sleep_quality BETWEEN 1 AND 5),
  feedback_notes         text,
  duration_minutes       integer
);
ALTER TABLE public.workout_executions ENABLE ROW LEVEL SECURITY;

-- ── 12. body_measurements ─────────────────────────────────────
-- Colunas usadas em useProgress.ts:
-- student_id, trainer_id, measured_at, weight_kg, height_cm,
-- body_fat_pct, chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, calf_cm, notes
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at   date DEFAULT current_date,
  weight_kg     numeric,
  height_cm     numeric,
  body_fat_pct  numeric,
  chest_cm      numeric,
  waist_cm      numeric,
  hip_cm        numeric,
  arm_cm        numeric,
  thigh_cm      numeric,
  calf_cm       numeric,
  photo_url     text,
  notes         text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- ── 13. payment_plans ────────────────────────────────────────
-- Colunas: trainer_id, name, price, sessions_per_month, description
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text NOT NULL,
  price               numeric NOT NULL DEFAULT 0,
  sessions_per_month  integer,
  description         text,
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

-- ── 14. payments ─────────────────────────────────────────────
-- Colunas usadas em usePayments.ts (useCreatePayment):
-- trainer_id, student_id, plan_id, amount, due_date, paid_at, status,
-- reference_month, notes
-- usePayments faz JOIN: "*, payment_plans(*)"
CREATE TABLE IF NOT EXISTS public.payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id          uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  amount           numeric NOT NULL DEFAULT 0,
  due_date         date NOT NULL,
  paid_at          timestamptz,
  status           text DEFAULT 'pending'
    CHECK (status IN ('pending','paid','overdue','cancelled')),
  reference_month  text,
  notes            text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ── 15. user_streaks ─────────────────────────────────────────
-- Colunas usadas em useGamification.ts:
-- user_id, current_streak, longest_streak, total_workouts, last_workout_date
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak    integer DEFAULT 0,
  longest_streak    integer DEFAULT 0,
  total_workouts    integer DEFAULT 0,
  last_workout_date date,
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- ── 16. badges ───────────────────────────────────────────────
-- Colunas: name, description, icon, requirement_type, requirement_value, category
CREATE TABLE IF NOT EXISTS public.badges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  description         text,
  icon                text DEFAULT '🏅',
  requirement_type    text NOT NULL
    CHECK (requirement_type IN ('workouts','streak','weight_loss','special','total_workouts')),
  requirement_value   integer NOT NULL DEFAULT 1,
  category            text DEFAULT 'milestone',
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- ── 17. user_badges ──────────────────────────────────────────
-- Colunas: user_id, badge_id, earned_at
-- useUserBadges faz JOIN: "*, badge:badges(*)"
CREATE TABLE IF NOT EXISTS public.user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ── 18. student_fitness_profiles ─────────────────────────────
-- Colunas usadas em useStudentFitnessProfile.ts:
-- user_id, trainer_id, objective, level, training_location, notes
CREATE TABLE IF NOT EXISTS public.student_fitness_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  objective         text DEFAULT 'general',
  level             text DEFAULT 'beginner',
  training_location text DEFAULT 'gym',
  notes             text,
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.student_fitness_profiles ENABLE ROW LEVEL SECURITY;

-- ── 19. invite_codes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  trainer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_used     boolean DEFAULT false,
  used_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trainer_settings_updated_at ON public.trainer_settings;
CREATE TRIGGER update_trainer_settings_updated_at
  BEFORE UPDATE ON public.trainer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Auto-create profile on signup ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'))
  ON CONFLICT (user_id, role) DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'trainer' THEN
    INSERT INTO public.trainer_settings (trainer_id)
    VALUES (NEW.id)
    ON CONFLICT (trainer_id) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES — Drop all first, then recreate cleanly
-- ============================================================
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- user_roles
CREATE POLICY "ur_sel" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "prof_self"    ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prof_trainer" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid());
CREATE POLICY "prof_student_trainer" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'student') AND user_id IN (
    SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "prof_upd_self"    ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prof_upd_trainer" ON public.profiles FOR UPDATE USING (
  public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid());

-- availability
CREATE POLICY "avail_trainer" ON public.availability FOR ALL   USING (auth.uid() = trainer_id);
CREATE POLICY "avail_student" ON public.availability FOR SELECT USING (
  trainer_id IN (SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- sessions
CREATE POLICY "sess_read"   ON public.sessions FOR SELECT USING (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_create" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = trainer_id);
CREATE POLICY "sess_upd_t"  ON public.sessions FOR UPDATE USING (auth.uid() = trainer_id);
CREATE POLICY "sess_upd_s"  ON public.sessions FOR UPDATE USING (auth.uid() = student_id);

-- notifications
CREATE POLICY "notif_read" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_ins"  ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_upd"  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- messages
CREATE POLICY "msg_read" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "msg_send" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_upd"  ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- trainer_settings
CREATE POLICY "ts_all" ON public.trainer_settings FOR ALL USING (auth.uid() = trainer_id);

-- exercises
CREATE POLICY "ex_sel" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "ex_ins" ON public.exercises FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "ex_upd" ON public.exercises FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- workout_plans
CREATE POLICY "wp_sel" ON public.workout_plans FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "wp_ins" ON public.workout_plans FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "wp_upd" ON public.workout_plans FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid());
CREATE POLICY "wp_del" ON public.workout_plans FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

-- workout_exercises
CREATE POLICY "we_sel" ON public.workout_exercises FOR SELECT TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans
    WHERE trainer_id = auth.uid() OR student_id = auth.uid()));
CREATE POLICY "we_ins" ON public.workout_exercises FOR INSERT TO authenticated WITH CHECK (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "we_upd" ON public.workout_exercises FOR UPDATE TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "we_del" ON public.workout_exercises FOR DELETE TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));

-- workout_executions
CREATE POLICY "wex_sel" ON public.workout_executions FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "wex_ins" ON public.workout_executions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- body_measurements
CREATE POLICY "bm_sel" ON public.body_measurements FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "bm_ins" ON public.body_measurements FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "bm_upd" ON public.body_measurements FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid());
CREATE POLICY "bm_del" ON public.body_measurements FOR DELETE TO authenticated
  USING (trainer_id = auth.uid());

-- payment_plans
CREATE POLICY "pp_all" ON public.payment_plans FOR ALL TO authenticated
  USING (trainer_id = auth.uid());

-- payments
CREATE POLICY "pay_sel" ON public.payments FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "pay_ins" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "pay_upd" ON public.payments FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid());

-- user_streaks
CREATE POLICY "us_sel" ON public.user_streaks FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  user_id IN (SELECT student_id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "us_ins" ON public.user_streaks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "us_upd" ON public.user_streaks FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- badges
CREATE POLICY "b_sel"  ON public.badges FOR SELECT TO authenticated USING (true);

-- user_badges
CREATE POLICY "ub_sel" ON public.user_badges FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  user_id IN (SELECT student_id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "ub_ins" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- student_fitness_profiles
CREATE POLICY "fp_sel" ON public.student_fitness_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "fp_ins" ON public.student_fitness_profiles FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "fp_upd" ON public.student_fitness_profiles FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid() OR user_id = auth.uid());

-- invite_codes
CREATE POLICY "inv_sel" ON public.invite_codes FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR used_by = auth.uid());
CREATE POLICY "inv_ins" ON public.invite_codes FOR INSERT TO authenticated
  WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "inv_upd" ON public.invite_codes FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_trainer   ON public.sessions(trainer_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_student   ON public.sessions(student_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_status    ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_notif_user         ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conv      ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_trainer   ON public.profiles(trainer_id);
CREATE INDEX IF NOT EXISTS idx_availability       ON public.availability(trainer_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_workout_plans_t    ON public.workout_plans(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_s    ON public.workout_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_trainer   ON public.payments(trainer_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_student   ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks       ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges        ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle   ON public.exercises(muscle_group);

-- ============================================================
-- DADOS SEED — Exercícios padrão (28 exercícios)
-- ============================================================
INSERT INTO public.exercises (name, muscle_group, description, is_default) VALUES
  ('Supino Reto',               'Peito',       'Exercício básico para peitoral maior', true),
  ('Supino Inclinado',          'Peito',       'Ênfase no peitoral superior', true),
  ('Crucifixo com Halteres',    'Peito',       'Isolador do peitoral', true),
  ('Flexão de Braço',           'Peito',       'Peso corporal para peitoral e tríceps', true),
  ('Pulldown (Puxada Alta)',    'Costas',      'Latíssimo do dorso na polia alta', true),
  ('Remada Curvada com Barra', 'Costas',      'Massa de costas — latíssimo e trapézio', true),
  ('Remada Unilateral',         'Costas',      'Remada com halter para simetria', true),
  ('Barra Fixa',                'Costas',      'Pull-up no peso corporal', true),
  ('Agachamento Livre',         'Pernas',      'Quadríceps, glúteos e core', true),
  ('Leg Press 45°',             'Pernas',      'Máquina para quadríceps e glúteos', true),
  ('Cadeira Extensora',         'Pernas',      'Isolador de quadríceps', true),
  ('Cadeira Flexora',           'Pernas',      'Isolador de isquiotibiais', true),
  ('Levantamento Terra',        'Pernas',      'Posterior de coxa, costas e glúteos', true),
  ('Afundo (Lunge)',            'Pernas',      'Unilateral para equilíbrio e quadríceps', true),
  ('Elevação Pélvica',          'Glúteos',     'Hip thrust para máximo recrutamento glúteo', true),
  ('Abdução de Quadril',        'Glúteos',     'Isolador de glúteo médio', true),
  ('Desenvolvimento c/ Halteres','Ombros',    'Press overhead para deltoides', true),
  ('Elevação Lateral',          'Ombros',      'Deltoide lateral com halteres', true),
  ('Elevação Frontal',          'Ombros',      'Deltoide anterior com halter ou barra', true),
  ('Rosca Direta com Barra',   'Bíceps',      'Flexão de cúbito para bíceps', true),
  ('Rosca Alternada',           'Bíceps',      'Alternado com halteres — supinação', true),
  ('Rosca Concentrada',         'Bíceps',      'Isolador de bíceps', true),
  ('Tríceps Pulley',            'Tríceps',     'Extensão de tríceps na polia alta', true),
  ('Mergulho em Paralelas',     'Tríceps',     'Peso corporal para tríceps e peitoral', true),
  ('Prancha Isométrica',        'Abdômen',     'Estabilização do core', true),
  ('Abdominal Crunch',          'Abdômen',     'Flexão de tronco — reto abdominal', true),
  ('Panturrilha em Pé',         'Panturrilha', 'Gastrocnêmio em pé no step', true),
  ('Corrida (Esteira/Pista)',   'Cardio',      'Aeróbico de moderada a alta intensidade', true),
  ('Bicicleta Ergométrica',     'Cardio',      'Cardio de baixo impacto', true),
  ('Burpee',                    'Funcional',   'Exercício completo de corpo inteiro', true),
  ('Kettlebell Swing',          'Funcional',   'Explosão de quadril e condicionamento', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DADOS SEED — Badges padrão
-- ============================================================
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value, category) VALUES
  ('Primeiro Passo',    'Completou o primeiro treino',           '🥇', 'workouts',      1,   'milestone'),
  ('Na Sequência',      'Manteve 7 dias consecutivos de treino', '🔥', 'streak',        7,   'streak'),
  ('Guerreiro',         'Completou 10 treinos',                  '💪', 'workouts',      10,  'milestone'),
  ('Dedicado',          'Manteve 14 dias consecutivos',          '⚡', 'streak',        14,  'streak'),
  ('Veterano',          'Completou 25 treinos',                  '🏆', 'workouts',      25,  'milestone'),
  ('Imparável',         'Manteve 30 dias consecutivos',          '🌟', 'streak',        30,  'streak'),
  ('Centurião',         'Completou 100 treinos',                 '👑', 'total_workouts',100, 'milestone')
ON CONFLICT DO NOTHING;
-- ============================================================
-- FitApp — Sistema de Planos e Permissões
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── 1. Enum de tiers ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('starter', 'pro', 'business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Tabela de subscriptions dos trainers ───────────────────
CREATE TABLE IF NOT EXISTS public.trainer_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier   plan_tier NOT NULL DEFAULT 'starter',
  status      text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'trial')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: trainer lê apenas o próprio; service_role pode atualizar
DROP POLICY IF EXISTS "ts_plan_select" ON public.trainer_subscriptions;
DROP POLICY IF EXISTS "ts_plan_update" ON public.trainer_subscriptions;
CREATE POLICY "ts_plan_select" ON public.trainer_subscriptions
  FOR SELECT USING (auth.uid() = trainer_id);
-- apenas service_role / admin pode atualizar tier
-- (trainers não podem se auto-promover)

-- ── 3. Trigger: auto-criar subscription 'starter' para novos trainers ──
CREATE OR REPLACE FUNCTION public.handle_new_trainer_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Só cria se for trainer
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'trainer' THEN
    INSERT INTO public.trainer_subscriptions (trainer_id, plan_tier, status)
    VALUES (NEW.id, 'starter', 'active')
    ON CONFLICT (trainer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_trainer_created_subscription ON auth.users;
CREATE TRIGGER on_trainer_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_trainer_subscription();

-- ── 4. Backfill: criar subscription para trainers já existentes ──
INSERT INTO public.trainer_subscriptions (trainer_id, plan_tier, status)
SELECT ur.user_id, 'starter', 'active'
FROM public.user_roles ur
WHERE ur.role = 'trainer'
ON CONFLICT (trainer_id) DO NOTHING;

-- ── 5. Promover ribeiroleonardoti@gmail.com para PRO ─────────
UPDATE public.trainer_subscriptions
SET plan_tier = 'pro', status = 'active', updated_at = now()
WHERE trainer_id = (
  SELECT user_id FROM public.profiles WHERE email = 'ribeiroleonardoti@gmail.com' LIMIT 1
);

-- ── 6. Índice ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trainer_subscriptions_trainer
  ON public.trainer_subscriptions(trainer_id);

-- ── 7. Updated_at trigger ─────────────────────────────────────
DROP TRIGGER IF EXISTS update_trainer_subscriptions_updated_at ON public.trainer_subscriptions;
CREATE TRIGGER update_trainer_subscriptions_updated_at
  BEFORE UPDATE ON public.trainer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================
-- Migration: Suporte a Vídeos e Arquivos no Chat
-- Data: 2026-04-22
-- ============================================================

-- 1. Adicionando colunas na tabela de mensagens
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type text;

-- 2. Criando o bucket de storage para mídia do chat
-- Nota: Isso cria o bucket se ele não existir (requer permissões de admin no Supabase)
-- Se falhar via SQL, pode ser criado manualmente no painel (nome: chat-media)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de RLS para o bucket chat-media
-- Permitir upload para usuários autenticados
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

-- Permitir leitura pública (já que o bucket é público, mas reforçando)
CREATE POLICY "Public access to chat media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');
-- Create progress_photos table
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    type TEXT CHECK (type IN ('front', 'side', 'back', 'other')) DEFAULT 'other',
    captured_at DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- Policies
-- Trainers can see and manage photos of their students
CREATE POLICY "Trainers can manage student photos" 
ON public.progress_photos
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = progress_photos.student_id 
        AND p.trainer_id = auth.uid()
    )
);

-- Students can see their own photos
CREATE POLICY "Students can see own photos" 
ON public.progress_photos
FOR SELECT 
TO authenticated
USING (auth.uid() = student_id);

-- Students can upload their own photos (optional, depending on business logic)
CREATE POLICY "Students can upload own photos" 
ON public.progress_photos
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Create storage bucket for progress photos
-- Note: This part usually needs to be done via Supabase Dashboard or API, 
-- but we can add the storage policy here.

-- Allow public access to photos (or restricted)
-- For simplicity, let's assume the bucket 'progress-photos' exists.
-- ============================================================
-- Correção Definitiva de RLS: Sessions & Notifications
-- ============================================================

-- 1. SESSIONS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas antigas de sessions para evitar conflitos
DROP POLICY IF EXISTS "sess_read" ON public.sessions;
DROP POLICY IF EXISTS "sess_insert" ON public.sessions;
DROP POLICY IF EXISTS "sess_update" ON public.sessions;
DROP POLICY IF EXISTS "sess_delete" ON public.sessions;
DROP POLICY IF EXISTS "sess_create" ON public.sessions;
DROP POLICY IF EXISTS "sess_upd_t" ON public.sessions;
DROP POLICY IF EXISTS "sess_upd_s" ON public.sessions;
DROP POLICY IF EXISTS "Students can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can cancel own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;

-- Criar as políticas corretas
CREATE POLICY "sess_read" ON public.sessions 
  FOR SELECT USING (auth.uid() = trainer_id OR auth.uid() = student_id);

CREATE POLICY "sess_insert" ON public.sessions 
  FOR INSERT WITH CHECK (auth.uid() = trainer_id OR auth.uid() = student_id);

CREATE POLICY "sess_update" ON public.sessions 
  FOR UPDATE USING (auth.uid() = trainer_id OR auth.uid() = student_id);

CREATE POLICY "sess_delete" ON public.sessions 
  FOR DELETE USING (auth.uid() = trainer_id);


-- 2. NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Limpar antigas
DROP POLICY IF EXISTS "notif_read" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;

-- O Trainer precisa poder INSERIR uma notificação para o Aluno (user_id = aluno),
-- então a regra de inserção precisa verificar se quem insere é o dono da notificação 
-- OU se quem insere é o trainer do dono da notificação.
CREATE POLICY "notif_read" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_update" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notif_insert" ON public.notifications 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = public.notifications.user_id 
      AND trainer_id = auth.uid()
    )
  );
