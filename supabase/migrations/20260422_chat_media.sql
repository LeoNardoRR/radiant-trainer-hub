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
