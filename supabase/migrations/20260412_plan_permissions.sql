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
