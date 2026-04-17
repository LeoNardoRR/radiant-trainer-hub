/**
 * DemoMode — injeta dados realistas no cache do React Query
 * para que TODAS as telas mostrem dados sem precisar do Supabase.
 *
 * Ativado via botão no banner flutuante ou em /settings.
 * Pode ser desativado a qualquer momento.
 */
import { createContext, useContext, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Dados mock ────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);
const d = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const MOCK_STUDENTS = [
  { id: "demo-s1", user_id: "demo-uid-1", full_name: "Ana Beatriz Santos",  email: "ana@demo.com",     phone: "(11) 98765-0001", status: "active",   trainer_id: "trainer", role: "student" as const, invited_by: null, created_at: new Date().toISOString(), specialty: null, avatar_url: null, invite_code: null },
  { id: "demo-s2", user_id: "demo-uid-2", full_name: "Carlos Eduardo Melo", email: "carlos@demo.com",  phone: "(11) 98765-0002", status: "active",   trainer_id: "trainer", role: "student" as const, invited_by: null, created_at: new Date().toISOString(), specialty: null, avatar_url: null, invite_code: null },
  { id: "demo-s3", user_id: "demo-uid-3", full_name: "Fernanda Lima",       email: "fernanda@demo.com",phone: "(11) 98765-0003", status: "at_risk",  trainer_id: "trainer", role: "student" as const, invited_by: null, created_at: new Date().toISOString(), specialty: null, avatar_url: null, invite_code: null },
  { id: "demo-s4", user_id: "demo-uid-4", full_name: "Rafael Souza",        email: "rafael@demo.com",  phone: "(11) 98765-0004", status: "active",   trainer_id: "trainer", role: "student" as const, invited_by: null, created_at: new Date().toISOString(), specialty: null, avatar_url: null, invite_code: null },
  { id: "demo-s5", user_id: "demo-uid-5", full_name: "Juliana Costa",       email: "juliana@demo.com", phone: "(11) 98765-0005", status: "inactive", trainer_id: "trainer", role: "student" as const, invited_by: null, created_at: new Date().toISOString(), specialty: null, avatar_url: null, invite_code: null },
];

const MOCK_SESSIONS = [
  // Ana
  { id: "sess-1", trainer_id: "t", student_id: "demo-uid-1", date: TODAY,    start_time: "07:00", end_time: "08:00", status: "approved",  session_type: "Cardio + Core",     notes: null, student: MOCK_STUDENTS[0] },
  { id: "sess-2", trainer_id: "t", student_id: "demo-uid-1", date: d(-1),   start_time: "07:00", end_time: "08:00", status: "completed", session_type: "Musculação B",       notes: null, student: MOCK_STUDENTS[0] },
  { id: "sess-3", trainer_id: "t", student_id: "demo-uid-1", date: d(-4),   start_time: "07:00", end_time: "08:00", status: "completed", session_type: "Musculação A",       notes: null, student: MOCK_STUDENTS[0] },
  // Carlos
  { id: "sess-4", trainer_id: "t", student_id: "demo-uid-2", date: TODAY,    start_time: "18:00", end_time: "19:00", status: "pending",   session_type: "Hipertrofia A",      notes: null, student: MOCK_STUDENTS[1] },
  { id: "sess-5", trainer_id: "t", student_id: "demo-uid-2", date: d(-2),   start_time: "18:00", end_time: "19:00", status: "completed", session_type: "Hipertrofia B",       notes: null, student: MOCK_STUDENTS[1] },
  { id: "sess-6", trainer_id: "t", student_id: "demo-uid-2", date: d(-5),   start_time: "18:00", end_time: "19:00", status: "missed",    session_type: "Pernas",              notes: "Faltou sem aviso", student: MOCK_STUDENTS[1] },
  // Fernanda
  { id: "sess-7", trainer_id: "t", student_id: "demo-uid-3", date: d(2),    start_time: "09:00", end_time: "10:00", status: "pending",   session_type: "Funcional Iniciante", notes: null, student: MOCK_STUDENTS[2] },
  { id: "sess-8", trainer_id: "t", student_id: "demo-uid-3", date: d(-7),   start_time: "09:00", end_time: "10:00", status: "missed",    session_type: "Cardio Leve",         notes: "Faltou", student: MOCK_STUDENTS[2] },
  { id: "sess-9", trainer_id: "t", student_id: "demo-uid-3", date: d(-14),  start_time: "09:00", end_time: "10:00", status: "missed",    session_type: "Funcional",           notes: "Faltou", student: MOCK_STUDENTS[2] },
  // Rafael
  { id: "sess-10", trainer_id: "t", student_id: "demo-uid-4", date: TODAY,  start_time: "06:00", end_time: "07:30", status: "approved",  session_type: "Força — Agachamento", notes: null, student: MOCK_STUDENTS[3] },
  { id: "sess-11", trainer_id: "t", student_id: "demo-uid-4", date: d(-1),  start_time: "06:00", end_time: "07:30", status: "completed", session_type: "Força — Terra",       notes: null, student: MOCK_STUDENTS[3] },
  { id: "sess-12", trainer_id: "t", student_id: "demo-uid-4", date: d(-3),  start_time: "06:00", end_time: "07:30", status: "completed", session_type: "Força — Supino",      notes: null, student: MOCK_STUDENTS[3] },
  // Juliana
  { id: "sess-13", trainer_id: "t", student_id: "demo-uid-5", date: d(-3),  start_time: "10:00", end_time: "11:00", status: "pending",   session_type: "Retomada",            notes: null, student: MOCK_STUDENTS[4] },
  { id: "sess-14", trainer_id: "t", student_id: "demo-uid-5", date: d(-22), start_time: "10:00", end_time: "11:00", status: "completed", session_type: "Iniciante",           notes: null, student: MOCK_STUDENTS[4] },
];

const MOCK_NOTIFICATIONS = [
  { id: "n1", user_id: "t", type: "retention", title: "Fernanda em risco",           message: "Fernanda Lima faltou 3 sessões consecutivas. Considere entrar em contato.", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString(), data: null },
  { id: "n2", user_id: "t", type: "retention", title: "Juliana inativa há 3 semanas",message: "Juliana Costa não comparece há 22 dias. Risco de abandono elevado.",        is_read: false, created_at: new Date(Date.now() - 7200000).toISOString(), data: null },
  { id: "n3", user_id: "t", type: "session",   title: "Carlos solicitou sessão",     message: "Carlos Eduardo quer agendar treino hoje às 18h.",                          is_read: false, created_at: new Date(Date.now() - 1800000).toISOString(), data: null },
  { id: "n4", user_id: "t", type: "achievement",title: "Rafael bateu recorde!",      message: "Rafael Souza completou 14 dias seguidos de treino!",                       is_read: true,  created_at: new Date(Date.now() - 86400000).toISOString(), data: null },
  { id: "n5", user_id: "t", type: "session",   title: "Ana confirmou sessão",        message: "Ana Beatriz confirmou presença para às 07h de hoje.",                      is_read: true,  created_at: new Date(Date.now() - 86400000 * 2).toISOString(), data: null },
];

const MOCK_STREAK = {
  id: "streak-me", user_id: "me",
  current_streak: 8, longest_streak: 14, total_workouts: 23,
  last_workout_date: d(-1), updated_at: new Date().toISOString(),
};

const MOCK_LEADERBOARD = [
  { user_id: "demo-uid-4", name: "Rafael Souza",        total_workouts: 38, current_streak: 14, badges: 3, score: 398 },
  { user_id: "demo-uid-1", name: "Ana Beatriz Santos",  total_workouts: 23, current_streak: 8,  badges: 3, score: 306 },
  { user_id: "demo-uid-2", name: "Carlos Eduardo Melo", total_workouts: 16, current_streak: 5,  badges: 2, score: 225 },
  { user_id: "demo-uid-3", name: "Fernanda Lima",       total_workouts: 4,  current_streak: 1,  badges: 1, score: 65  },
  { user_id: "demo-uid-5", name: "Juliana Costa",       total_workouts: 2,  current_streak: 0,  badges: 0, score: 20  },
];

const MOCK_BADGES_ALL = [
  { id: "b1", name: "Primeiro Passo", description: "Completou o primeiro treino",  icon: "🥇", requirement_type: "workouts", requirement_value: 1,  category: "milestone", created_at: "" },
  { id: "b2", name: "Na Sequência",   description: "7 dias de sequência",          icon: "🔥", requirement_type: "streak",   requirement_value: 7,  category: "streak",    created_at: "" },
  { id: "b3", name: "Guerreiro",      description: "10 treinos completados",       icon: "💪", requirement_type: "workouts", requirement_value: 10, category: "milestone", created_at: "" },
  { id: "b4", name: "Dedicado",       description: "14 dias seguidos",             icon: "⚡", requirement_type: "streak",   requirement_value: 14, category: "streak",    created_at: "" },
  { id: "b5", name: "Veterano",       description: "25 treinos completados",       icon: "🏆", requirement_type: "workouts", requirement_value: 25, category: "milestone", created_at: "" },
];

const MOCK_USER_BADGES = [
  { id: "ub1", user_id: "me", badge_id: "b1", earned_at: new Date(Date.now() - 86400000 * 18).toISOString(), badge: MOCK_BADGES_ALL[0] },
  { id: "ub2", user_id: "me", badge_id: "b2", earned_at: new Date(Date.now() - 86400000 * 5).toISOString(),  badge: MOCK_BADGES_ALL[1] },
  { id: "ub3", user_id: "me", badge_id: "b3", earned_at: new Date(Date.now() - 86400000 * 8).toISOString(),  badge: MOCK_BADGES_ALL[2] },
];

const MOCK_MEASUREMENTS = [
  { id: "m1", user_id: "demo-uid-1", trainer_id: "t", measured_at: d(-90), weight_kg: 72.5, height_cm: 165, body_fat_pct: 28.0, chest_cm: 92, waist_cm: 78, hip_cm: 100, arm_cm: 32, thigh_cm: 58, calf_cm: 37, notes: "Avaliação inicial" },
  { id: "m2", user_id: "demo-uid-1", trainer_id: "t", measured_at: d(-60), weight_kg: 70.8, height_cm: 165, body_fat_pct: 26.5, chest_cm: 91, waist_cm: 76, hip_cm: 98,  arm_cm: 31, thigh_cm: 57, calf_cm: 37, notes: "Boa evolução" },
  { id: "m3", user_id: "demo-uid-1", trainer_id: "t", measured_at: d(-30), weight_kg: 69.2, height_cm: 165, body_fat_pct: 25.1, chest_cm: 90, waist_cm: 74, hip_cm: 97,  arm_cm: 31, thigh_cm: 56, calf_cm: 36, notes: "Ótimo ritmo!" },
  { id: "m4", user_id: "demo-uid-1", trainer_id: "t", measured_at: d(-3),  weight_kg: 67.8, height_cm: 165, body_fat_pct: 23.8, chest_cm: 89, waist_cm: 72, hip_cm: 96,  arm_cm: 30, thigh_cm: 55, calf_cm: 36, notes: "Resultado incrível em 3 meses!" },
];

const MOCK_WORKOUT_PLANS = [
  {
    id: "wp1", trainer_id: "t", student_id: "demo-uid-1", name: "Ficha A — Emagrecimento",
    description: "Foco em cardio + circuito funcional.", is_active: true, created_at: d(-90),
    workout_exercises: [
      { id: "we1", exercise_name: "Esteira inclinada",    sets: 1, reps: null,  weight_kg: null,  rest_seconds: 60,  technical_notes: "15 min, inclinação 6%",                order_index: 1 },
      { id: "we2", exercise_name: "Leg Press 45°",        sets: 3, reps: "15",  weight_kg: null,  rest_seconds: 45,  technical_notes: "Amplitude parcial, proteger joelho",    order_index: 2 },
      { id: "we3", exercise_name: "Cadeira Extensora",    sets: 3, reps: "15",  weight_kg: null,  rest_seconds: 45,  technical_notes: "Peso leve, foco em contração",          order_index: 3 },
      { id: "we4", exercise_name: "Supino com Halteres",  sets: 3, reps: "12",  weight_kg: 10,    rest_seconds: 45,  technical_notes: null,                                    order_index: 4 },
      { id: "we5", exercise_name: "Remada Baixa na Polia",sets: 3, reps: "12",  weight_kg: null,  rest_seconds: 45,  technical_notes: "Escápulas juntas no final",             order_index: 5 },
      { id: "we6", exercise_name: "Abdominal Bicicleta",  sets: 3, reps: "20",  weight_kg: null,  rest_seconds: 30,  technical_notes: null,                                    order_index: 6 },
    ],
  },
  {
    id: "wp2", trainer_id: "t", student_id: "demo-uid-2", name: "Hipertrofia Intermediária",
    description: "Periodização 3x/semana. Volume moderado-alto.", is_active: true, created_at: d(-75),
    workout_exercises: [
      { id: "we7",  exercise_name: "Supino Reto",          sets: 4, reps: "10", weight_kg: 80,  rest_seconds: 90, technical_notes: "Descer até o peito",       order_index: 1 },
      { id: "we8",  exercise_name: "Crucifixo Inclinado",  sets: 3, reps: "12", weight_kg: 16,  rest_seconds: 60, technical_notes: null,                        order_index: 2 },
      { id: "we9",  exercise_name: "Barra Fixa",           sets: 4, reps: "8",  weight_kg: null,rest_seconds: 90, technical_notes: "Pegada pronada",            order_index: 3 },
      { id: "we10", exercise_name: "Rosca Direta",         sets: 3, reps: "12", weight_kg: 20,  rest_seconds: 45, technical_notes: null,                        order_index: 4 },
    ],
  },
  {
    id: "wp3", trainer_id: "t", student_id: "demo-uid-4", name: "Força Avançado — Pré-Competição",
    description: "Treino de força máxima. 4-6 repetições.", is_active: true, created_at: d(-60),
    workout_exercises: [
      { id: "we11", exercise_name: "Agachamento Livre",    sets: 5, reps: "5",  weight_kg: 140, rest_seconds: 180, technical_notes: "Abaixo do paralelo",       order_index: 1 },
      { id: "we12", exercise_name: "Levantamento Terra",   sets: 4, reps: "5",  weight_kg: 160, rest_seconds: 180, technical_notes: "Form check obrigatório",   order_index: 2 },
      { id: "we13", exercise_name: "Supino Reto",          sets: 5, reps: "5",  weight_kg: 120, rest_seconds: 180, technical_notes: null,                        order_index: 3 },
    ],
  },
];

const MOCK_EXECUTIONS = [
  { id: "ex1", workout_plan_id: "wp1", student_id: "demo-uid-1", energy_level: 4, muscle_soreness: 2, sleep_quality: 5, duration_minutes: 55, notes: "Me senti ótima hoje! Mais inclinação na esteira.", executed_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "ex2", workout_plan_id: "wp1", student_id: "demo-uid-1", energy_level: 3, muscle_soreness: 3, sleep_quality: 4, duration_minutes: 50, notes: "Cansada do trabalho, mas completei tudo.",          executed_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "ex3", workout_plan_id: "wp3", student_id: "demo-uid-4", energy_level: 5, muscle_soreness: 4, sleep_quality: 5, duration_minutes: 90, notes: "PR no agachamento: 145kg!",                        executed_at: new Date(Date.now() - 86400000 * 3).toISOString() },
];

const MOCK_PAYMENT_PLANS = [
  { id: "pp1", trainer_id: "t", name: "Mensal 3x/sem", price: 350, sessions_per_month: 12, description: "3 sessões por semana, 50 min.", created_at: "" },
  { id: "pp2", trainer_id: "t", name: "Mensal 2x/sem", price: 250, sessions_per_month:  8, description: "2 sessões por semana, 50 min.", created_at: "" },
];

const MOCK_PAYMENTS = [
  { id: "pay1", trainer_id: "t", student_id: "demo-uid-1", payment_plan_id: "pp1", amount: 350, due_date: d(5),   status: "pending", reference_month: "2026-04", paid_at: null,     student_profile: { full_name: "Ana Beatriz Santos" } },
  { id: "pay2", trainer_id: "t", student_id: "demo-uid-1", payment_plan_id: "pp1", amount: 350, due_date: d(-25), status: "paid",    reference_month: "2026-03", paid_at: d(-20),   student_profile: { full_name: "Ana Beatriz Santos" } },
  { id: "pay3", trainer_id: "t", student_id: "demo-uid-2", payment_plan_id: "pp2", amount: 250, due_date: d(5),   status: "pending", reference_month: "2026-04", paid_at: null,     student_profile: { full_name: "Carlos Eduardo Melo" } },
  { id: "pay4", trainer_id: "t", student_id: "demo-uid-3", payment_plan_id: "pp2", amount: 250, due_date: d(-5),  status: "overdue", reference_month: "2026-04", paid_at: null,     student_profile: { full_name: "Fernanda Lima" } },
  { id: "pay5", trainer_id: "t", student_id: "demo-uid-4", payment_plan_id: "pp1", amount: 350, due_date: d(5),   status: "paid",    reference_month: "2026-04", paid_at: d(-2),    student_profile: { full_name: "Rafael Souza" } },
  { id: "pay6", trainer_id: "t", student_id: "demo-uid-5", payment_plan_id: "pp2", amount: 250, due_date: d(-30), status: "overdue", reference_month: "2026-03", paid_at: null,     student_profile: { full_name: "Juliana Costa" } },
  { id: "pay7", trainer_id: "t", student_id: "demo-uid-5", payment_plan_id: "pp2", amount: 250, due_date: d(-60), status: "overdue", reference_month: "2026-02", paid_at: null,     student_profile: { full_name: "Juliana Costa" } },
];

const MOCK_MESSAGES = [
  { id: "msg1", sender_id: "t", receiver_id: "demo-uid-1", content: "Oi Ana! Excelente progresso no mês! -4.7kg em 3 meses, incrível! 💪", is_read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "msg2", sender_id: "demo-uid-1", receiver_id: "t", content: "Obrigada! Tô adorando os treinos. Posso fazer mais pesado na esteira?", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "msg3", sender_id: "t", receiver_id: "demo-uid-1", content: "Claro! Vamos passar para inclinação 8% na próxima sessão.", is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: "msg4", sender_id: "demo-uid-4", receiver_id: "t", content: "Personal, bati PR hoje no agachamento: 145kg!", is_read: false, created_at: new Date(Date.now() - 900000).toISOString() },
];

// ── Context ───────────────────────────────────────────────────
interface DemoCtx {
  isDemo: boolean;
  enable: () => void;
  disable: () => void;
}
const DemoContext = createContext<DemoCtx>({ isDemo: false, enable: () => {}, disable: () => {} });

export const useDemoMode = () => useContext(DemoContext);

// ── Provider ──────────────────────────────────────────────────
export const DemoModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const qc = useQueryClient();
  const { user, role } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const injectData = useCallback(() => {
    const uid = user?.id ?? "me";
    const isTrainer = role === "trainer";

    if (isTrainer) {
      // ── TRAINER: vê todos os alunos, sessões, pagamentos ──
      qc.setQueryData(["students", uid], MOCK_STUDENTS);
      qc.setQueryData(["sessions", uid], MOCK_SESSIONS);
      qc.setQueryData(["notifications", uid], MOCK_NOTIFICATIONS);
      qc.setQueryData(["payments", uid], MOCK_PAYMENTS);
      qc.setQueryData(["payment-plans", uid], MOCK_PAYMENT_PLANS);
      qc.setQueryData(["workout-plans", uid], MOCK_WORKOUT_PLANS);
      qc.setQueryData(["badges"], MOCK_BADGES_ALL);
      qc.setQueryData(["leaderboard", undefined, uid], MOCK_LEADERBOARD);
      // Medidas de cada aluno demo
      qc.setQueryData(["body-measurements", "demo-uid-1"], MOCK_MEASUREMENTS);
      qc.setQueryData(["workout-executions", "wp1"], MOCK_EXECUTIONS.filter(e => e.workout_plan_id === "wp1"));
      qc.setQueryData(["workout-executions", "wp3"], MOCK_EXECUTIONS.filter(e => e.workout_plan_id === "wp3"));
    } else {
      // ── STUDENT: vê APENAS seus próprios dados ──
      // Simula que este aluno é a "Ana Beatriz" do demo

      // Sessões só da Ana (nada de outros alunos)
      const mySessions = MOCK_SESSIONS.filter(s => s.student_id === "demo-uid-1").map(s => ({
        ...s,
        student_id: uid,          // mapeia para o user real
        student: { ...s.student, user_id: uid },
      }));
      qc.setQueryData(["sessions", uid], mySessions);

      // Streak pessoal
      qc.setQueryData(["user-streak", uid], { ...MOCK_STREAK, user_id: uid });

      // Badges pessoais
      qc.setQueryData(["user-badges", uid], MOCK_USER_BADGES);
      qc.setQueryData(["badges"], MOCK_BADGES_ALL);

      // Leaderboard — aparece no dashboard do aluno
      qc.setQueryData(["leaderboard", undefined, uid], MOCK_LEADERBOARD);

      // Notificações do aluno (não do trainer)
      qc.setQueryData(["notifications", uid], [
        {
          id: "n-s1", user_id: uid, type: "session",
          title: "Sessão confirmada para amanhã",
          message: "Seu treino de Cardio + Core está confirmado para hoje às 07h.",
          is_read: false, created_at: new Date(Date.now() - 3600000).toISOString(), data: null,
        },
        {
          id: "n-s2", user_id: uid, type: "achievement",
          title: "Sequência de 8 dias!",
          message: "Parabéns! Você está há 8 dias consecutivos treinando. Continue assim!",
          is_read: true, created_at: new Date(Date.now() - 86400000).toISOString(), data: null,
        },
      ]);

      // Ficha de treino — apenas a ficha da Ana
      qc.setQueryData(["workout-plans", uid], MOCK_WORKOUT_PLANS.filter(p => p.student_id === "demo-uid-1"));

      // Histórico de execuções da Ana
      qc.setQueryData(["workout-executions", "wp1"], MOCK_EXECUTIONS.filter(e => e.workout_plan_id === "wp1"));

      // Medidas — apenas da Ana
      qc.setQueryData(["body-measurements", uid], MOCK_MEASUREMENTS);
    }
  }, [qc, user, role]);

  const enable = useCallback(() => {
    setIsDemo(true);
    injectData();
    timerRef.current = setInterval(injectData, 20_000);
    toast.success("Modo Demo ativado!", { duration: 3000 });
  }, [injectData]);

  const disable = useCallback(() => {
    setIsDemo(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    qc.clear();
    toast("Modo Demo desativado.");
  }, [qc]);

  return (
    <DemoContext.Provider value={{ isDemo, enable, disable }}>
      {children}
    </DemoContext.Provider>
  );
};
