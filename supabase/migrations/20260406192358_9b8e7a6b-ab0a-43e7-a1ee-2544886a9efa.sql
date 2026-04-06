
-- Add makeup session tracking columns
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS makeup_deadline date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS original_session_id uuid DEFAULT NULL;

-- Add makeup_days_limit to trainer_settings
ALTER TABLE public.trainer_settings
  ADD COLUMN IF NOT EXISTS makeup_days_limit integer NOT NULL DEFAULT 7;
