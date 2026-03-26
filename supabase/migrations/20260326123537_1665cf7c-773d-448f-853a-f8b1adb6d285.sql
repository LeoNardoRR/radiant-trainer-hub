
-- Fix infinite recursion in profiles RLS
-- Drop the recursive policy
DROP POLICY IF EXISTS "Students can read their trainer" ON public.profiles;

-- Create security definer function to get trainer_id for current user
CREATE OR REPLACE FUNCTION public.get_my_trainer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trainer_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Recreate policy without recursion
CREATE POLICY "Students can read their trainer"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND user_id = public.get_my_trainer_id()
);

-- Create invite_codes table for trainer-student linking
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Trainers can manage their own invite codes
CREATE POLICY "Trainers manage own invite codes"
ON public.invite_codes
FOR ALL
TO authenticated
USING (auth.uid() = trainer_id)
WITH CHECK (auth.uid() = trainer_id);

-- Anyone authenticated can read a code (to use it during signup)
CREATE POLICY "Users can read invite codes by code"
ON public.invite_codes
FOR SELECT
TO authenticated
USING (true);

-- Anyone authenticated can update invite codes (mark as used)
CREATE POLICY "Users can use invite codes"
ON public.invite_codes
FOR UPDATE
TO authenticated
USING (is_used = false);
