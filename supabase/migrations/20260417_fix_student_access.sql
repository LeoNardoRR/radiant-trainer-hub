-- ============================================================
-- FitApp — Fix student access issues
-- 20260417_fix_student_access — Production hotfix
-- ============================================================

-- ── invite_codes: allow any authenticated user to SELECT (to redeem a code)
-- The hotfix_rls restricted reading to trainer_id OR used_by, breaking student redemption
DROP POLICY IF EXISTS "inv_read"   ON public.invite_codes;
DROP POLICY IF EXISTS "inv_insert" ON public.invite_codes;
DROP POLICY IF EXISTS "inv_update" ON public.invite_codes;
DROP POLICY IF EXISTS "inv_sel"    ON public.invite_codes;
DROP POLICY IF EXISTS "inv_ins"    ON public.invite_codes;
DROP POLICY IF EXISTS "inv_upd"    ON public.invite_codes;
DROP POLICY IF EXISTS "Trainers manage own invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can read invite codes by code" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can use invite codes" ON public.invite_codes;

-- Any authenticated user can read codes (needed to validate/redeem)
CREATE POLICY "inv_read"   ON public.invite_codes
  FOR SELECT TO authenticated USING (true);

-- Only trainers can create codes
CREATE POLICY "inv_insert" ON public.invite_codes
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());

-- Any authenticated user can update (mark as used) an unused code
CREATE POLICY "inv_update" ON public.invite_codes
  FOR UPDATE TO authenticated USING (is_used = false OR trainer_id = auth.uid());

-- ── profiles: students must be able to read their own trainer's profile
-- (needed for StudentClassesPage to show trainer name, etc.)
DROP POLICY IF EXISTS "prof_read_my_trainer" ON public.profiles;
DROP POLICY IF EXISTS "Students can read their trainer" ON public.profiles;

-- Use security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_my_trainer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trainer_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE POLICY "prof_read_my_trainer" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR trainer_id = auth.uid()
    OR user_id = public.get_my_trainer_id()
  );

-- ── payments: ensure students can read their own payments
DROP POLICY IF EXISTS "pay_read" ON public.payments;
CREATE POLICY "pay_read" ON public.payments
  FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() OR student_id = auth.uid());
