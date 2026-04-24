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
