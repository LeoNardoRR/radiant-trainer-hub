-- ============================================================
-- SUPER HOTFIX — RLS COMPLETO
-- Cola TUDO no Supabase SQL Editor e rode de uma vez.
-- Resolve: insert bloqueado em qualquer tabela.
-- ============================================================

-- ── Dropa TODAS as políticas do schema público ─────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── Garante RLS habilitado ─────────────────────────────────
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
           AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════
-- POLÍTICAS — uma por tabela, simples e funcionais
-- ═══════════════════════════════════════════════════════════

-- user_roles
CREATE POLICY "ur_read"   ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ur_insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- profiles
CREATE POLICY "prof_read_own"     ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prof_read_trainer" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid());
CREATE POLICY "prof_read_my_trainer" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'student') AND user_id IN (
    SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "prof_update_own"     ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prof_update_trainer" ON public.profiles FOR UPDATE USING (
  public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid());

-- availability
CREATE POLICY "av_all_trainer" ON public.availability FOR ALL USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "av_read_student" ON public.availability FOR SELECT USING (
  trainer_id IN (SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- sessions — TRAINER cria e gerencia, ALUNO lê as suas
CREATE POLICY "sess_read"   ON public.sessions FOR SELECT  USING (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_insert" ON public.sessions FOR INSERT  WITH CHECK (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_update" ON public.sessions FOR UPDATE  USING (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_delete" ON public.sessions FOR DELETE  USING (auth.uid() = trainer_id);

-- notifications — sistema pode inserir, usuário lê/marca as suas
CREATE POLICY "notif_read"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- messages
CREATE POLICY "msg_read"   ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "msg_insert" ON public.messages FOR INSERT  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_update" ON public.messages FOR UPDATE  USING (auth.uid() = receiver_id);

-- trainer_settings
CREATE POLICY "ts_all" ON public.trainer_settings FOR ALL USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

-- exercises — qualquer autenticado lê; trainer cria/edita os seus
CREATE POLICY "ex_read"   ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "ex_insert" ON public.exercises FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "ex_update" ON public.exercises FOR UPDATE TO authenticated USING (created_by = auth.uid() OR is_default = true);
CREATE POLICY "ex_delete" ON public.exercises FOR DELETE TO authenticated USING (created_by = auth.uid());

-- workout_plans — trainer cria para alunos, ambos lêem
CREATE POLICY "wp_read"   ON public.workout_plans FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "wp_insert" ON public.workout_plans FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "wp_update" ON public.workout_plans FOR UPDATE TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "wp_delete" ON public.workout_plans FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- workout_exercises — herdado do plano
CREATE POLICY "we_read"   ON public.workout_exercises FOR SELECT TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid() OR student_id = auth.uid()));
CREATE POLICY "we_insert" ON public.workout_exercises FOR INSERT TO authenticated WITH CHECK (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "we_update" ON public.workout_exercises FOR UPDATE TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "we_delete" ON public.workout_exercises FOR DELETE TO authenticated USING (
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));

-- workout_executions — aluno registra, trainer vê
CREATE POLICY "wex_read"   ON public.workout_executions FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR
  workout_plan_id IN (SELECT id FROM public.workout_plans WHERE trainer_id = auth.uid()));
CREATE POLICY "wex_insert" ON public.workout_executions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "wex_update" ON public.workout_executions FOR UPDATE TO authenticated USING (student_id = auth.uid());

-- body_measurements — trainer gerencia
CREATE POLICY "bm_read"   ON public.body_measurements FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "bm_insert" ON public.body_measurements FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "bm_update" ON public.body_measurements FOR UPDATE TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "bm_delete" ON public.body_measurements FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- payment_plans — trainer gerencia
CREATE POLICY "pp_all" ON public.payment_plans FOR ALL TO authenticated USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

-- payments — trainer cria, ambos lêem
CREATE POLICY "pay_read"   ON public.payments FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "pay_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "pay_update" ON public.payments FOR UPDATE TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "pay_delete" ON public.payments FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- user_streaks
CREATE POLICY "us_read"   ON public.user_streaks FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  user_id IN (SELECT user_id FROM public.profiles WHERE trainer_id = auth.uid()));
CREATE POLICY "us_insert" ON public.user_streaks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "us_update" ON public.user_streaks FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- badges — leitura pública autenticada
CREATE POLICY "b_read" ON public.badges FOR SELECT TO authenticated USING (true);

-- user_badges — usuário registra as suas
CREATE POLICY "ub_read"   ON public.user_badges FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  user_id IN (SELECT user_id FROM public.profiles WHERE trainer_id = auth.uid()));
CREATE POLICY "ub_insert" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- student_fitness_profiles
CREATE POLICY "fp_read"   ON public.student_fitness_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "fp_insert" ON public.student_fitness_profiles FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "fp_update" ON public.student_fitness_profiles FOR UPDATE TO authenticated USING (trainer_id = auth.uid() OR user_id = auth.uid());

-- invite_codes
CREATE POLICY "inv_read"   ON public.invite_codes FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR used_by = auth.uid());
CREATE POLICY "inv_insert" ON public.invite_codes FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "inv_update" ON public.invite_codes FOR UPDATE TO authenticated USING (true);

-- ── Colunas obrigatórias (caso não existam ainda) ──────────
ALTER TABLE public.sessions         ADD COLUMN IF NOT EXISTS makeup_deadline     date;
ALTER TABLE public.sessions         ADD COLUMN IF NOT EXISTS original_session_id uuid;
ALTER TABLE public.trainer_settings ADD COLUMN IF NOT EXISTS makeup_days_limit   int NOT NULL DEFAULT 7;
ALTER TABLE public.notifications    ADD COLUMN IF NOT EXISTS data                jsonb;
ALTER TABLE public.profiles         ADD COLUMN IF NOT EXISTS avatar_url          text;
ALTER TABLE public.profiles         ADD COLUMN IF NOT EXISTS specialty           text;
ALTER TABLE public.profiles         ADD COLUMN IF NOT EXISTS bio                 text;

-- ── Seed exercícios (apenas se tabela estiver vazia) ───────
INSERT INTO public.exercises (name, muscle_group, description, is_default)
SELECT * FROM (VALUES
  ('Supino Reto',              'Peito',       'Exercício básico para peitoral maior', true),
  ('Supino Inclinado',         'Peito',       'Ênfase no peitoral superior', true),
  ('Crucifixo com Halteres',   'Peito',       'Isolador do peitoral', true),
  ('Flexão de Braço',          'Peito',       'Peso corporal para peitoral e tríceps', true),
  ('Pulldown (Puxada Alta)',   'Costas',      'Latíssimo do dorso na polia alta', true),
  ('Remada Curvada com Barra','Costas',      'Massa de costas', true),
  ('Remada Unilateral',        'Costas',      'Com halter para simetria', true),
  ('Barra Fixa',               'Costas',      'Pull-up no peso corporal', true),
  ('Agachamento Livre',        'Pernas',      'Quadríceps, glúteos e core', true),
  ('Leg Press 45°',            'Pernas',      'Máquina para quadríceps e glúteos', true),
  ('Cadeira Extensora',        'Pernas',      'Isolador de quadríceps', true),
  ('Cadeira Flexora',          'Pernas',      'Isolador de isquiotibiais', true),
  ('Levantamento Terra',       'Pernas',      'Posterior de coxa, costas e glúteos', true),
  ('Afundo (Lunge)',           'Pernas',      'Unilateral para equilíbrio', true),
  ('Elevação Pélvica',         'Glúteos',     'Hip thrust para glúteo', true),
  ('Abdução de Quadril',       'Glúteos',     'Glúteo médio com cabo', true),
  ('Desenvolvimento c/ Halteres','Ombros',   'Press overhead para deltoides', true),
  ('Elevação Lateral',         'Ombros',      'Deltoide lateral', true),
  ('Elevação Frontal',         'Ombros',      'Deltoide anterior', true),
  ('Rosca Direta com Barra',  'Bíceps',      'Flexão de cotovelo', true),
  ('Rosca Alternada',          'Bíceps',      'Com halteres — supinação', true),
  ('Tríceps Pulley',           'Tríceps',     'Extensão na polia alta', true),
  ('Mergulho em Paralelas',    'Tríceps',     'Peso corporal para tríceps', true),
  ('Prancha Isométrica',       'Abdômen',     'Estabilização do core', true),
  ('Abdominal Crunch',         'Abdômen',     'Reto abdominal', true),
  ('Panturrilha em Pé',        'Panturrilha', 'Gastrocnêmio no step', true),
  ('Corrida (Esteira)',        'Cardio',      'Aeróbico moderado a intenso', true),
  ('Bicicleta Ergométrica',    'Cardio',      'Cardio de baixo impacto', true),
  ('Burpee',                   'Funcional',   'Exercício de corpo inteiro', true),
  ('Kettlebell Swing',         'Funcional',   'Explosão de quadril', true)
) AS v(name, muscle_group, description, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises LIMIT 1);

-- ── Seed badges ────────────────────────────────────────────
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value, category)
SELECT * FROM (VALUES
  ('Primeiro Passo',   'Completou o primeiro treino',           '🥇', 'workouts',      1,   'milestone'),
  ('Na Sequência',     'Manteve 7 dias consecutivos',           '🔥', 'streak',        7,   'streak'),
  ('Guerreiro',        'Completou 10 treinos',                  '💪', 'workouts',      10,  'milestone'),
  ('Dedicado',         'Manteve 14 dias consecutivos',          '⚡', 'streak',        14,  'streak'),
  ('Veterano',         'Completou 25 treinos',                  '🏆', 'workouts',      25,  'milestone'),
  ('Imparável',        'Manteve 30 dias consecutivos',          '🌟', 'streak',        30,  'streak'),
  ('Centurião',        'Completou 100 treinos',                 '👑', 'total_workouts',100, 'milestone')
) AS v(name, description, icon, requirement_type, requirement_value, category)
WHERE NOT EXISTS (SELECT 1 FROM public.badges LIMIT 1);
