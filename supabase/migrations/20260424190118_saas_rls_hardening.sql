-- ============================================================
-- SAAS RLS HARDENING (Isolamento Multi-Tenant)
-- ============================================================

-- 1. Invite Codes - Impedir que qualquer usuário atualize convites alheios
DROP POLICY IF EXISTS "inv_update" ON public.invite_codes;
CREATE POLICY "inv_update" ON public.invite_codes 
FOR UPDATE TO authenticated 
USING (trainer_id = auth.uid()) 
WITH CHECK (trainer_id = auth.uid());

-- Permitir que alunos usem o código (update no used_by) APENAS SE o código não estiver usado
-- Uma abordagem melhor seria uma função SECURITY DEFINER, mas via RLS:
CREATE POLICY "inv_redeem" ON public.invite_codes 
FOR UPDATE TO authenticated 
USING (is_used = false)
WITH CHECK (used_by = auth.uid());


-- 2. Exercises - Proteger exercícios globais (is_default = true)
DROP POLICY IF EXISTS "ex_update" ON public.exercises;
CREATE POLICY "ex_update" ON public.exercises 
FOR UPDATE TO authenticated 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid()); -- Remove a permissão de alterar is_default

DROP POLICY IF EXISTS "ex_delete" ON public.exercises;
CREATE POLICY "ex_delete" ON public.exercises 
FOR DELETE TO authenticated 
USING (created_by = auth.uid());


-- 3. Payments - Proteger edição de pagamentos para não roubar dados
DROP POLICY IF EXISTS "pay_update" ON public.payments;
CREATE POLICY "pay_update" ON public.payments 
FOR UPDATE TO authenticated 
USING (trainer_id = auth.uid())
WITH CHECK (trainer_id = auth.uid());

-- 4. Payment Plans
DROP POLICY IF EXISTS "pp_all" ON public.payment_plans;
CREATE POLICY "pp_read" ON public.payment_plans FOR SELECT TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "pp_insert" ON public.payment_plans FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "pp_update" ON public.payment_plans FOR UPDATE TO authenticated USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "pp_delete" ON public.payment_plans FOR DELETE TO authenticated USING (trainer_id = auth.uid());


-- 5. Workout Executions - Aluno não pode alterar execuções de outros alunos
DROP POLICY IF EXISTS "wex_update" ON public.workout_executions;
CREATE POLICY "wex_update" ON public.workout_executions 
FOR UPDATE TO authenticated 
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());


-- 6. User Roles - Bloquear inserção manual de roles de admin via API pública
DROP POLICY IF EXISTS "ur_insert" ON public.user_roles;
CREATE POLICY "ur_insert" ON public.user_roles 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id AND role != 'admin'); -- Ninguém pode se dar admin


-- 7. Funções de Segurança (Definir Trainer/Tenant)
-- Opcional, para queries mais rápidas e blindadas em vez de usar IN (SELECT ...)
CREATE OR REPLACE FUNCTION get_my_trainer_id() 
RETURNS uuid 
LANGUAGE sql SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT trainer_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- SAAS PERFORMANCE (Indexes on Foreign Keys)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_trainer_id ON public.profiles(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer_id ON public.sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON public.sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_trainer_id ON public.workout_plans(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_student_id ON public.workout_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_plan_id ON public.workout_exercises(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_trainer_id ON public.payments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);

