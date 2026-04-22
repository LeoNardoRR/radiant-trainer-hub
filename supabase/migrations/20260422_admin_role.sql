-- ============================================================
-- ADMIN ROLE SETUP
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Verifique se o enum de role já inclui 'admin'
--    Se der erro "already exists", ignore.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END$$;

-- 2. Para promover um usuário existente a admin, rode:
--    Substitua 'EMAIL_DO_ADMIN_AQUI' pelo email real.
UPDATE profiles
SET role = 'admin'
WHERE email = 'EMAIL_DO_ADMIN_AQUI';

-- 3. Política RLS: admin pode ver TUDO nas tabelas principais
--    (Execute cada bloco separadamente se der erro)

-- payments: admin vê todos
CREATE POLICY "admin_view_all_payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- profiles: admin vê todos
CREATE POLICY "admin_view_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. Verificar quem é admin atualmente
SELECT user_id, full_name, email, role
FROM profiles
WHERE role = 'admin';
