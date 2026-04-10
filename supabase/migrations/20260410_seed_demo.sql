-- ============================================================
-- FITTRACKER — SEED DE DEMONSTRAÇÃO
-- ============================================================
-- INSTRUÇÕES:
--   1. Acesse supabase.com → SQL Editor
--   2. Cole e execute o bloco PASSO 0 primeiro para descobrir
--      seu trainer_id
--   3. Depois execute o script completo (PASSO 1 em diante)
-- ============================================================

-- ============================================================
-- PASSO 0: Descubra seu trainer_id (execute isso primeiro)
-- ============================================================
-- SELECT user_id, full_name, role FROM profiles WHERE role = 'trainer' LIMIT 5;
-- Copie o user_id retornado e substitua todas as ocorrências de
-- 'SEU_TRAINER_ID_AQUI' abaixo antes de executar o resto.
-- ============================================================

DO $$
DECLARE
  -- ⚠️  SUBSTITUA pelo seu trainer user_id (resultado do PASSO 0)
  v_trainer_id  UUID := 'SEU_TRAINER_ID_AQUI';

  -- UUIDs fixos para os 5 alunos (não mude)
  s1 UUID := 'a1000000-0000-0000-0000-000000000001'; -- Ana Beatriz
  s2 UUID := 'a2000000-0000-0000-0000-000000000002'; -- Carlos Eduardo
  s3 UUID := 'a3000000-0000-0000-0000-000000000003'; -- Fernanda Lima
  s4 UUID := 'a4000000-0000-0000-0000-000000000004'; -- Rafael Souza
  s5 UUID := 'a5000000-0000-0000-0000-000000000005'; -- Juliana Costa

  -- Badge IDs
  badge_first   UUID;
  badge_streak  UUID;
  badge_ten     UUID;

  -- Auxiliary
  plan1_id UUID := gen_random_uuid();
  plan2_id UUID := gen_random_uuid();
  plan3_id UUID := gen_random_uuid();
  ppay1_id UUID := gen_random_uuid();
  ppay2_id UUID := gen_random_uuid();

BEGIN

-- ============================================================
-- 1. CRIAR USUÁRIOS NO auth.users
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  is_super_admin, phone
) VALUES
  (s1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'ana.beatriz@demo.com', crypt('Demo@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', false, NULL),
  (s2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'carlos.eduardo@demo.com', crypt('Demo@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', false, NULL),
  (s3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'fernanda.lima@demo.com', crypt('Demo@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', false, NULL),
  (s4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rafael.souza@demo.com', crypt('Demo@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', false, NULL),
  (s5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'juliana.costa@demo.com', crypt('Demo@123', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{}',
   '', '', false, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. PERFIS DOS ALUNOS
-- ============================================================
INSERT INTO profiles (user_id, trainer_id, full_name, email, phone, role, status)
VALUES
  (s1, v_trainer_id, 'Ana Beatriz Santos',  'ana.beatriz@demo.com',    '(11) 98765-0001', 'student', 'active'),
  (s2, v_trainer_id, 'Carlos Eduardo Melo', 'carlos.eduardo@demo.com', '(11) 98765-0002', 'student', 'active'),
  (s3, v_trainer_id, 'Fernanda Lima',       'fernanda.lima@demo.com',  '(11) 98765-0003', 'student', 'at_risk'),
  (s4, v_trainer_id, 'Rafael Souza',        'rafael.souza@demo.com',   '(11) 98765-0004', 'student', 'active'),
  (s5, v_trainer_id, 'Juliana Costa',       'juliana.costa@demo.com',  '(11) 98765-0005', 'student', 'inactive')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 3. PERFIS FITNESS
-- ============================================================
INSERT INTO student_fitness_profiles (user_id, trainer_id, objective, level, training_location, notes)
VALUES
  (s1, v_trainer_id, 'weight_loss',   'intermediate', 'gym',     'Restrição no joelho esquerdo — evitar agachamento profundo.'),
  (s2, v_trainer_id, 'muscle_gain',   'intermediate', 'gym',     'Foco em hipertrofia. Alergia à creatina.'),
  (s3, v_trainer_id, 'conditioning',  'beginner',     'hybrid',  'Iniciante. Prefere treinar de manhã.'),
  (s4, v_trainer_id, 'muscle_gain',   'advanced',     'gym',     'Atleta amador. Competição em agosto.'),
  (s5, v_trainer_id, 'general',       'beginner',     'home',    'Treina em casa. Não tem equipamentos pesados.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. SESSÕES (últimas 3 semanas + esta semana)
-- ============================================================
INSERT INTO sessions (trainer_id, student_id, date, start_time, end_time, status, session_type, notes)
VALUES
  -- Ana Beatriz (ativa, consistente)
  (v_trainer_id, s1, current_date - 18, '07:00', '08:00', 'completed', 'Musculação A',   NULL),
  (v_trainer_id, s1, current_date - 15, '07:00', '08:00', 'completed', 'Musculação B',   NULL),
  (v_trainer_id, s1, current_date - 13, '07:00', '08:00', 'completed', 'Cardio + Core',  NULL),
  (v_trainer_id, s1, current_date - 11, '07:00', '08:00', 'completed', 'Musculação A',   NULL),
  (v_trainer_id, s1, current_date - 8,  '07:00', '08:00', 'completed', 'Musculação B',   NULL),
  (v_trainer_id, s1, current_date - 6,  '07:00', '08:00', 'completed', 'Cardio + Core',  NULL),
  (v_trainer_id, s1, current_date - 4,  '07:00', '08:00', 'completed', 'Musculação A',   NULL),
  (v_trainer_id, s1, current_date - 1,  '07:00', '08:00', 'completed', 'Musculação B',   NULL),
  (v_trainer_id, s1, current_date,      '07:00', '08:00', 'approved',  'Cardio + Core',  NULL),

  -- Carlos Eduardo (ativo, bom ritmo)
  (v_trainer_id, s2, current_date - 17, '18:00', '19:00', 'completed', 'Treino A — Peito/Ombro', NULL),
  (v_trainer_id, s2, current_date - 14, '18:00', '19:00', 'completed', 'Treino B — Costas/Bíceps', NULL),
  (v_trainer_id, s2, current_date - 12, '18:00', '19:00', 'completed', 'Treino C — Pernas',       NULL),
  (v_trainer_id, s2, current_date - 9,  '18:00', '19:00', 'completed', 'Treino A — Peito/Ombro',  NULL),
  (v_trainer_id, s2, current_date - 7,  '18:00', '19:00', 'missed',    'Treino B',                'Não apareceu'),
  (v_trainer_id, s2, current_date - 5,  '18:00', '19:00', 'completed', 'Treino C — Pernas',       NULL),
  (v_trainer_id, s2, current_date - 2,  '18:00', '19:00', 'completed', 'Treino A — Peito/Ombro',  NULL),
  (v_trainer_id, s2, current_date + 1,  '18:00', '19:00', 'pending',   'Treino B',                NULL),

  -- Fernanda Lima (em risco — faltou muito)
  (v_trainer_id, s3, current_date - 20, '09:00', '10:00', 'completed', 'Funcional Iniciante', NULL),
  (v_trainer_id, s3, current_date - 18, '09:00', '10:00', 'missed',    'Cardio Leve',         'Faltou sem aviso'),
  (v_trainer_id, s3, current_date - 14, '09:00', '10:00', 'missed',    'Funcional',           'Faltou'),
  (v_trainer_id, s3, current_date - 10, '09:00', '10:00', 'completed', 'Funcional Iniciante', NULL),
  (v_trainer_id, s3, current_date - 7,  '09:00', '10:00', 'missed',    'Cardio Leve',         'Faltou'),
  (v_trainer_id, s3, current_date + 2,  '09:00', '10:00', 'pending',   'Funcional',           NULL),

  -- Rafael Souza (avançado, alta frequência)
  (v_trainer_id, s4, current_date - 19, '06:00', '07:30', 'completed', 'Hipertrofia A', NULL),
  (v_trainer_id, s4, current_date - 17, '06:00', '07:30', 'completed', 'Hipertrofia B', NULL),
  (v_trainer_id, s4, current_date - 15, '06:00', '07:30', 'completed', 'Hipertrofia C', NULL),
  (v_trainer_id, s4, current_date - 13, '06:00', '07:30', 'completed', 'Hipertrofia A', NULL),
  (v_trainer_id, s4, current_date - 11, '06:00', '07:30', 'completed', 'Hipertrofia B', NULL),
  (v_trainer_id, s4, current_date - 9,  '06:00', '07:30', 'completed', 'Hipertrofia C', NULL),
  (v_trainer_id, s4, current_date - 7,  '06:00', '07:30', 'completed', 'Hipertrofia A', NULL),
  (v_trainer_id, s4, current_date - 5,  '06:00', '07:30', 'completed', 'Hipertrofia B', NULL),
  (v_trainer_id, s4, current_date - 3,  '06:00', '07:30', 'completed', 'Hipertrofia C', NULL),
  (v_trainer_id, s4, current_date - 1,  '06:00', '07:30', 'approved',  'Hipertrofia A', NULL),
  (v_trainer_id, s4, current_date,      '06:00', '07:30', 'approved',  'Hipertrofia B', NULL),

  -- Juliana Costa (inativa — última sessão há 3 semanas)
  (v_trainer_id, s5, current_date - 25, '10:00', '11:00', 'completed', 'Treino Iniciante', NULL),
  (v_trainer_id, s5, current_date - 22, '10:00', '11:00', 'completed', 'Treino Iniciante', NULL),
  (v_trainer_id, s5, current_date - 19, '10:00', '11:00', 'missed',    'Treino Funcional', 'Inativa'),
  (v_trainer_id, s5, current_date - 3,  '10:00', '11:00', 'pending',   'Retomada',         NULL);

-- ============================================================
-- 5. STREAKS / GAMIFICAÇÃO
-- ============================================================
INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_workouts, last_workout_date)
VALUES
  (s1, 8,  12, 23, current_date - 1),
  (s2, 5,  8,  16, current_date - 2),
  (s3, 1,  5,  4,  current_date - 10),
  (s4, 14, 21, 38, current_date - 1),
  (s5, 0,  3,  2,  current_date - 22)
ON CONFLICT (user_id) DO UPDATE
  SET current_streak   = EXCLUDED.current_streak,
      longest_streak   = EXCLUDED.longest_streak,
      total_workouts   = EXCLUDED.total_workouts,
      last_workout_date = EXCLUDED.last_workout_date;

-- ============================================================
-- 6. BADGES
-- ============================================================
-- Garantir que os badges existem
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, category)
VALUES
  ('Primeiro Passo',   'Completou o primeiro treino',     '🥇', 'workouts', 1,  'milestone'),
  ('Na Sequência',     'Manteve 7 dias de sequência',     '🔥', 'streak',   7,  'streak'),
  ('Guerreiro',        'Completou 10 treinos',            '💪', 'workouts', 10, 'milestone'),
  ('Dedicado',         'Manteve 14 dias seguidos',        '⚡', 'streak',   14, 'streak'),
  ('Veterano',         'Completou 25 treinos',            '🏆', 'workouts', 25, 'milestone')
ON CONFLICT DO NOTHING;

-- Pegar IDs dos badges
SELECT id INTO badge_first  FROM badges WHERE requirement_type = 'workouts' AND requirement_value = 1  LIMIT 1;
SELECT id INTO badge_streak FROM badges WHERE requirement_type = 'streak'   AND requirement_value = 7  LIMIT 1;
SELECT id INTO badge_ten    FROM badges WHERE requirement_type = 'workouts' AND requirement_value = 10 LIMIT 1;

-- Atribuir badges aos alunos
INSERT INTO user_badges (user_id, badge_id, earned_at)
VALUES
  -- Ana (active): primeiro + streak + 10 treinos
  (s1, badge_first,  now() - interval '18 days'),
  (s1, badge_streak, now() - interval '5 days'),
  (s1, badge_ten,    now() - interval '8 days'),
  -- Carlos: primeiro + streak
  (s2, badge_first,  now() - interval '17 days'),
  (s2, badge_streak, now() - interval '10 days'),
  -- Fernanda: apenas primeiro
  (s3, badge_first,  now() - interval '20 days'),
  -- Rafael: todos
  (s4, badge_first,  now() - interval '19 days'),
  (s4, badge_streak, now() - interval '10 days'),
  (s4, badge_ten,    now() - interval '14 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. NOTIFICAÇÕES
-- ============================================================
INSERT INTO notifications (user_id, type, title, message, is_read)
VALUES
  (v_trainer_id, 'retention', 'Fernanda em risco',
   'Fernanda Lima faltou 3 sessões consecutivas. Considere entrar em contato.',
   false),
  (v_trainer_id, 'retention', 'Juliana inativa há 3 semanas',
   'Juliana Costa não comparece há 22 dias. Risco de abandono elevado.',
   false),
  (v_trainer_id, 'session',   'Carlos solicitou sessão',
   'Carlos Eduardo quer agendar treino amanhã às 18h.',
   false),
  (v_trainer_id, 'achievement', 'Rafael bateu recorde!',
   'Rafael Souza completou 14 dias seguidos de treino.',
   true),
  (v_trainer_id, 'session',   'Ana confirmou sessão de hoje',
   'Ana Beatriz confirmou presença para às 07h.',
   true);

-- ============================================================
-- 8. MEDIDAS CORPORAIS (histórico de 3 meses)
-- ============================================================
INSERT INTO body_measurements (
  user_id, trainer_id, measured_at,
  weight_kg, height_cm, body_fat_pct,
  chest_cm, waist_cm, hip_cm, arm_cm, thigh_cm, calf_cm,
  notes
)
VALUES
  -- Ana: perdendo peso consistentemente
  (s1, v_trainer_id, current_date - 90,
   72.5, 165, 28.0, 92, 78, 100, 32, 58, 37,
   'Avaliação inicial. Objetivo: perda de peso.'),
  (s1, v_trainer_id, current_date - 60,
   70.8, 165, 26.5, 91, 76, 98, 31, 57, 37,
   'Boa evolução na circunferência abdominal.'),
  (s1, v_trainer_id, current_date - 30,
   69.2, 165, 25.1, 90, 74, 97, 31, 56, 36,
   'Mantendo ritmo excelente!'),
  (s1, v_trainer_id, current_date - 3,
   67.8, 165, 23.8, 89, 72, 96, 30, 55, 36,
   'Resultado incrível em 3 meses.'),

  -- Carlos: ganhando massa
  (s2, v_trainer_id, current_date - 75,
   78.0, 178, 18.5, 98, 82, 96, 35, 60, 38, NULL),
  (s2, v_trainer_id, current_date - 45,
   80.2, 178, 17.8, 100, 83, 96, 36, 61, 38, 'Ganhando massa bem.'),
  (s2, v_trainer_id, current_date - 10,
   82.5, 178, 17.0, 103, 83, 97, 37, 62, 39, 'Ótimo progresso em hipertrofia.'),

  -- Rafael: atleta avançado
  (s4, v_trainer_id, current_date - 60,
   88.0, 182, 12.5, 110, 84, 100, 42, 66, 41, 'Pré-temporada. Foco em força.'),
  (s4, v_trainer_id, current_date - 30,
   89.5, 182, 11.8, 112, 84, 101, 43, 67, 41, NULL),
  (s4, v_trainer_id, current_date - 5,
   90.2, 182, 11.2, 114, 83, 101, 44, 68, 42, 'Pico de força atingido.'),

  -- Fernanda: início do programa
  (s3, v_trainer_id, current_date - 20,
   65.0, 162, 32.0, 90, 82, 103, 28, 60, 36, 'Avaliação inicial. Medo de musculação.'),

  -- Juliana: avaliação inicial (única)
  (s5, v_trainer_id, current_date - 25,
   58.5, 160, 24.0, 85, 70, 94, 27, 52, 34, 'Treino em casa. Equipamentos limitados.');

-- ============================================================
-- 9. PLANOS DE PAGAMENTO
-- ============================================================
INSERT INTO payment_plans (id, trainer_id, name, price, sessions_per_month, description)
VALUES
  (ppay1_id, v_trainer_id, 'Plano Mensal — 3x/sem', 350.00, 12, '3 sessões por semana, 50 min cada.'),
  (ppay2_id, v_trainer_id, 'Plano Mensal — 2x/sem', 250.00,  8, '2 sessões por semana, 50 min cada.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. COBRANÇAS / PAGAMENTOS
-- ============================================================
INSERT INTO payments (
  trainer_id, student_id, payment_plan_id,
  amount, due_date, status, reference_month, paid_at
)
VALUES
  -- Ana (3x/sem — em dia)
  (v_trainer_id, s1, ppay1_id, 350.00, current_date - 30 + interval '5 days', 'paid',
   to_char(current_date - interval '1 month', 'YYYY-MM'),
   current_date - 25),
  (v_trainer_id, s1, ppay1_id, 350.00, current_date + interval '5 days',       'pending',
   to_char(current_date, 'YYYY-MM'), NULL),

  -- Carlos (2x/sem — em dia)
  (v_trainer_id, s2, ppay2_id, 250.00, current_date - 30 + interval '5 days', 'paid',
   to_char(current_date - interval '1 month', 'YYYY-MM'),
   current_date - 20),
  (v_trainer_id, s2, ppay2_id, 250.00, current_date + interval '5 days',       'pending',
   to_char(current_date, 'YYYY-MM'), NULL),

  -- Fernanda (2x/sem — atrasada!)
  (v_trainer_id, s3, ppay2_id, 250.00, current_date - 30 + interval '5 days', 'paid',
   to_char(current_date - interval '1 month', 'YYYY-MM'),
   current_date - 22),
  (v_trainer_id, s3, ppay2_id, 250.00, current_date - interval '5 days',      'overdue',
   to_char(current_date, 'YYYY-MM'), NULL),

  -- Rafael (3x/sem — pago antecipado)
  (v_trainer_id, s4, ppay1_id, 350.00, current_date - 30 + interval '5 days', 'paid',
   to_char(current_date - interval '1 month', 'YYYY-MM'),
   current_date - 28),
  (v_trainer_id, s4, ppay1_id, 350.00, current_date + interval '5 days',       'paid',
   to_char(current_date, 'YYYY-MM'),
   current_date - 2),

  -- Juliana (inativa — atrasada há 2 meses)
  (v_trainer_id, s5, ppay2_id, 250.00, current_date - 60,                     'overdue',
   to_char(current_date - interval '2 months', 'YYYY-MM'), NULL),
  (v_trainer_id, s5, ppay2_id, 250.00, current_date - 30,                     'overdue',
   to_char(current_date - interval '1 month', 'YYYY-MM'), NULL);

-- ============================================================
-- 11. FICHAS DE TREINO (workout_plans + workout_exercises)
--     Obs: requer que a migration 20260410_new_features.sql
--          já tenha sido aplicada.
-- ============================================================
INSERT INTO workout_plans (id, trainer_id, student_id, name, description, is_active)
VALUES
  (plan1_id, v_trainer_id, s1, 'Ficha A — Emagrecimento',
   'Foco em cardio + circuito funcional. Baixo impacto no joelho.', true),
  (plan2_id, v_trainer_id, s2, 'Hipertrofia Intermediária',
   'Periodização 3x por semana. Volume moderado-alto.', true),
  (plan3_id, v_trainer_id, s4, 'Força Avançado — Pré-competição',
   'Treino de força máxima. 4-6 repetições, séries pesadas.', true)
ON CONFLICT (id) DO NOTHING;

-- Exercícios na ficha da Ana
INSERT INTO workout_exercises (workout_plan_id, exercise_name, sets, reps, rest_seconds, technical_notes, order_index)
VALUES
  (plan1_id, 'Esteira — caminhada inclinada',  1, NULL, 60, '15 min, inclinação 6%', 1),
  (plan1_id, 'Leg Press 45°',                  3, '15', 45, 'Amplitude parcial, proteção joelho', 2),
  (plan1_id, 'Cadeira Extensora',               3, '15', 45, 'Peso leve, foco em contração', 3),
  (plan1_id, 'Supino com Halteres',             3, '12', 45, NULL, 4),
  (plan1_id, 'Remada Baixa na Polia',           3, '12', 45, 'Escápulas juntas no final', 5),
  (plan1_id, 'Abdominal Bicicleta',             3, '20', 30, NULL, 6);

-- Exercícios na ficha do Carlos
INSERT INTO workout_exercises (workout_plan_id, exercise_name, sets, reps, rest_seconds, weight_kg, technical_notes, order_index)
VALUES
  (plan2_id, 'Supino Reto com Barra',           4, '10', 90,  80.0, 'Descer até o peito', 1),
  (plan2_id, 'Crucifixo Inclinado',             3, '12', 60,  16.0, NULL, 2),
  (plan2_id, 'Desenvolvimento com Halteres',    3, '12', 60,  22.0, NULL, 3),
  (plan2_id, 'Elevação Lateral',                3, '15', 45,  10.0, NULL, 4),
  (plan2_id, 'Barra Fixa',                      4, '8',  90,  NULL, 'Pegada pronada', 5),
  (plan2_id, 'Remada Curvada',                  3, '10', 75,  70.0, 'Costas paralelas ao chão', 6),
  (plan2_id, 'Rosca Direta',                    3, '12', 45,  20.0, NULL, 7);

-- Exercícios na ficha do Rafael
INSERT INTO workout_exercises (workout_plan_id, exercise_name, sets, reps, rest_seconds, weight_kg, technical_notes, order_index)
VALUES
  (plan3_id, 'Agachamento Livre',               5, '5',  180, 140.0, 'Abaixo do paralelo', 1),
  (plan3_id, 'Levantamento Terra',              4, '5',  180, 160.0, 'Form check obrig.', 2),
  (plan3_id, 'Supino Reto',                     5, '5',  180, 120.0, NULL, 3),
  (plan3_id, 'Desenvolvimento Militar',         3, '6',  120, 80.0,  NULL, 4),
  (plan3_id, 'Barra Fixa Lastrada',             4, '6',  120, 20.0,  NULL, 5);

-- ============================================================
-- 12. EXECUÇÕES DE TREINO (histórico do aluno s1 e s4)
-- ============================================================
INSERT INTO workout_executions (
  workout_plan_id, student_id,
  energy_level, muscle_soreness, sleep_quality,
  duration_minutes, notes, executed_at
)
VALUES
  (plan1_id, s1, 4, 2, 5, 55, 'Me senti ótima hoje! Consegui mais inclinação na esteira.', now() - interval '4 days'),
  (plan1_id, s1, 3, 3, 4, 50, 'Cansada do trabalho, mas completei tudo.', now() - interval '1 day'),
  (plan3_id, s4, 5, 4, 5, 90, 'PR no agachamento: 145kg! Ótima sessão.', now() - interval '3 days'),
  (plan3_id, s4, 5, 3, 5, 85, 'Terra bem pesado hoje, mas mantive a forma.', now() - interval '1 day');

-- ============================================================
-- FIM DO SEED
-- ============================================================
RAISE NOTICE '✅ Seed concluído com sucesso!';
RAISE NOTICE '   5 alunos criados: Ana, Carlos, Fernanda, Rafael, Juliana';
RAISE NOTICE '   Senha de todos os alunos: Demo@123';
RAISE NOTICE '   Dados criados: sessões, medidas, treinos, pagamentos, conquistas';

END $$;
