-- ============================================================
-- FitApp — Fix sessions RLS + create missing tables
-- 20260417 — Production hotfix
-- ============================================================

-- Drop and recreate sessions policies cleanly
DROP POLICY IF EXISTS "sess_read"   ON public.sessions;
DROP POLICY IF EXISTS "sess_insert" ON public.sessions;
DROP POLICY IF EXISTS "sess_update" ON public.sessions;
DROP POLICY IF EXISTS "sess_delete" ON public.sessions;
DROP POLICY IF EXISTS "trainers_can_insert_sessions" ON public.sessions;
DROP POLICY IF EXISTS "trainers_can_select_sessions" ON public.sessions;
DROP POLICY IF EXISTS "trainers_can_update_sessions" ON public.sessions;
DROP POLICY IF EXISTS "students_can_insert_session_requests" ON public.sessions;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sess_read"   ON public.sessions FOR SELECT  USING (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_insert" ON public.sessions FOR INSERT  WITH CHECK (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_update" ON public.sessions FOR UPDATE  USING (auth.uid() = trainer_id OR auth.uid() = student_id);
CREATE POLICY "sess_delete" ON public.sessions FOR DELETE  USING (auth.uid() = trainer_id);

-- ── trainer_subscriptions (missing table — causes 404) ───────
CREATE TABLE IF NOT EXISTS public.trainer_subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_tier   TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'business')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.trainer_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ts_sub_read"   ON public.trainer_subscriptions;
DROP POLICY IF EXISTS "ts_sub_insert" ON public.trainer_subscriptions;
DROP POLICY IF EXISTS "ts_sub_update" ON public.trainer_subscriptions;

CREATE POLICY "ts_sub_read"   ON public.trainer_subscriptions FOR SELECT USING (auth.uid() = trainer_id);
CREATE POLICY "ts_sub_insert" ON public.trainer_subscriptions FOR INSERT WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "ts_sub_update" ON public.trainer_subscriptions FOR UPDATE USING (auth.uid() = trainer_id);

-- ── body_measurements (missing table — causes 404) ────────────
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  measured_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    DECIMAL(5,2),
  height_cm    DECIMAL(5,1),
  body_fat_pct DECIMAL(4,1),
  chest_cm     DECIMAL(5,1),
  waist_cm     DECIMAL(5,1),
  hip_cm       DECIMAL(5,1),
  arm_cm       DECIMAL(5,1),
  thigh_cm     DECIMAL(5,1),
  calf_cm      DECIMAL(5,1),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bm_read"   ON public.body_measurements;
DROP POLICY IF EXISTS "bm_insert" ON public.body_measurements;
DROP POLICY IF EXISTS "bm_delete" ON public.body_measurements;

-- Trainers can manage measurements for their students; students can read their own
CREATE POLICY "bm_read" ON public.body_measurements FOR SELECT USING (
  auth.uid() = student_id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = student_id AND p.trainer_id = auth.uid()
  )
);
CREATE POLICY "bm_insert" ON public.body_measurements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = student_id AND p.trainer_id = auth.uid()
  )
  OR auth.uid() = student_id
);
CREATE POLICY "bm_delete" ON public.body_measurements FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = student_id AND p.trainer_id = auth.uid()
  )
);
