// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentStatus = 'active' | 'at_risk' | 'churned' | 'new';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  goal: string;
  plan: 'basic' | 'premium' | 'elite';
  status: StudentStatus;
  joinedAt: string;
  lastSession: string | null;
  nextSession: string | null;
  totalSessions: number;
  completedSessions: number;
  streak: number;
  avatar?: string;
  monthlyValue: number;
  retentionScore: number; // 0-100
  tags: string[];
}

export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: string;
  status: SessionStatus;
  notes?: string;
  location: 'presencial' | 'online';
}

export interface Notification {
  id: string;
  type: 'retention_risk' | 'missed_session' | 'streak' | 'payment' | 'birthday';
  studentId: string;
  studentName: string;
  message: string;
  action?: string;
  createdAt: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface DashboardStats {
  activeStudents: number;
  activeStudentsDelta: number;
  monthlyRevenue: number;
  monthlyRevenueDelta: number;
  sessionsThisMonth: number;
  sessionsDelta: number;
  retentionRate: number;
  retentionDelta: number;
  atRiskStudents: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ana Souza',
    email: 'ana.souza@email.com',
    phone: '(11) 99999-1234',
    goal: 'Emagrecimento',
    plan: 'elite',
    status: 'active',
    joinedAt: '2024-03-10',
    lastSession: '2025-04-08',
    nextSession: '2025-04-11',
    totalSessions: 48,
    completedSessions: 45,
    streak: 12,
    monthlyValue: 680,
    retentionScore: 95,
    tags: ['vip', 'pontual'],
  },
  {
    id: '2',
    name: 'Bruno Mendes',
    email: 'bruno.mendes@email.com',
    phone: '(11) 98888-5678',
    goal: 'Hipertrofia',
    plan: 'premium',
    status: 'at_risk',
    joinedAt: '2024-06-20',
    lastSession: '2025-03-28',
    nextSession: null,
    totalSessions: 32,
    completedSessions: 25,
    streak: 0,
    monthlyValue: 480,
    retentionScore: 38,
    tags: ['em risco'],
  },
  {
    id: '3',
    name: 'Carla Lima',
    email: 'carla.lima@email.com',
    phone: '(21) 97777-9012',
    goal: 'Condicionamento',
    plan: 'premium',
    status: 'active',
    joinedAt: '2024-09-05',
    lastSession: '2025-04-09',
    nextSession: '2025-04-12',
    totalSessions: 28,
    completedSessions: 27,
    streak: 8,
    monthlyValue: 480,
    retentionScore: 88,
    tags: ['assídua'],
  },
  {
    id: '4',
    name: 'Diego Santos',
    email: 'diego@email.com',
    phone: '(31) 96666-3456',
    goal: 'Força',
    plan: 'basic',
    status: 'new',
    joinedAt: '2025-04-01',
    lastSession: '2025-04-07',
    nextSession: '2025-04-14',
    totalSessions: 3,
    completedSessions: 3,
    streak: 2,
    monthlyValue: 280,
    retentionScore: 72,
    tags: ['novo'],
  },
  {
    id: '5',
    name: 'Elena Faria',
    email: 'elena@email.com',
    phone: '(11) 95555-7890',
    goal: 'Saúde & bem-estar',
    plan: 'elite',
    status: 'at_risk',
    joinedAt: '2024-01-15',
    lastSession: '2025-03-20',
    nextSession: null,
    totalSessions: 62,
    completedSessions: 50,
    streak: 0,
    monthlyValue: 680,
    retentionScore: 42,
    tags: ['em risco', 'vip'],
  },
  {
    id: '6',
    name: 'Felipe Rocha',
    email: 'felipe@email.com',
    phone: '(85) 94444-2345',
    goal: 'Resistência',
    plan: 'premium',
    status: 'active',
    joinedAt: '2024-11-10',
    lastSession: '2025-04-08',
    nextSession: '2025-04-11',
    totalSessions: 20,
    completedSessions: 19,
    streak: 5,
    monthlyValue: 480,
    retentionScore: 82,
    tags: ['assíduo'],
  },
];

export const MOCK_SESSIONS: Session[] = [
  { id: 's1', studentId: '1', studentName: 'Ana Souza', date: '2025-04-11', time: '07:00', duration: 60, type: 'Musculação', status: 'scheduled', location: 'presencial' },
  { id: 's2', studentId: '3', studentName: 'Carla Lima', date: '2025-04-11', time: '09:00', duration: 60, type: 'Funcional', status: 'scheduled', location: 'online' },
  { id: 's3', studentId: '6', studentName: 'Felipe Rocha', date: '2025-04-11', time: '11:00', duration: 45, type: 'Cardio HIIT', status: 'scheduled', location: 'presencial' },
  { id: 's4', studentId: '4', studentName: 'Diego Santos', date: '2025-04-14', time: '08:00', duration: 60, type: 'Avaliação', status: 'scheduled', location: 'presencial' },
  { id: 's5', studentId: '1', studentName: 'Ana Souza', date: '2025-04-08', time: '07:00', duration: 60, type: 'Musculação', status: 'completed', location: 'presencial' },
  { id: 's6', studentId: '2', studentName: 'Bruno Mendes', date: '2025-04-05', time: '10:00', duration: 60, type: 'Musculação', status: 'no_show', location: 'presencial' },
  { id: 's7', studentId: '3', studentName: 'Carla Lima', date: '2025-04-09', time: '09:00', duration: 60, type: 'Funcional', status: 'completed', location: 'online' },
  { id: 's8', studentId: '5', studentName: 'Elena Faria', date: '2025-04-03', time: '17:00', duration: 60, type: 'Pilates', status: 'cancelled', location: 'presencial' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'retention_risk',
    studentId: '2',
    studentName: 'Bruno Mendes',
    message: 'Sem sessão há 13 dias. Risco de cancelamento alto.',
    action: 'Enviar mensagem',
    createdAt: '2025-04-10T08:00:00',
    read: false,
    priority: 'high',
  },
  {
    id: 'n2',
    type: 'retention_risk',
    studentId: '5',
    studentName: 'Elena Faria',
    message: 'Elena não agenda há 21 dias. Score de retenção: 42/100.',
    action: 'Ligar agora',
    createdAt: '2025-04-09T14:00:00',
    read: false,
    priority: 'high',
  },
  {
    id: 'n3',
    type: 'missed_session',
    studentId: '2',
    studentName: 'Bruno Mendes',
    message: 'Não compareceu à sessão de 05/04 sem aviso.',
    action: 'Reagendar',
    createdAt: '2025-04-05T10:30:00',
    read: false,
    priority: 'medium',
  },
  {
    id: 'n4',
    type: 'streak',
    studentId: '1',
    studentName: 'Ana Souza',
    message: '🔥 Ana completou 12 sessões seguidas! Parabenize-a.',
    action: 'Enviar parabéns',
    createdAt: '2025-04-08T07:45:00',
    read: true,
    priority: 'low',
  },
  {
    id: 'n5',
    type: 'birthday',
    studentId: '3',
    studentName: 'Carla Lima',
    message: 'Aniversário de Carla é em 3 dias (14/04).',
    action: 'Preparar mensagem',
    createdAt: '2025-04-10T00:00:00',
    read: false,
    priority: 'low',
  },
];

export const MOCK_STATS: DashboardStats = {
  activeStudents: 6,
  activeStudentsDelta: 2,
  monthlyRevenue: 3080,
  monthlyRevenueDelta: 12,
  sessionsThisMonth: 24,
  sessionsDelta: 8,
  retentionRate: 78,
  retentionDelta: -3,
  atRiskStudents: 2,
};

export const REVENUE_CHART_DATA = [
  { month: 'Nov', revenue: 2100, sessions: 18 },
  { month: 'Dez', revenue: 1800, sessions: 14 },
  { month: 'Jan', revenue: 2400, sessions: 20 },
  { month: 'Fev', revenue: 2200, sessions: 19 },
  { month: 'Mar', revenue: 2700, sessions: 22 },
  { month: 'Abr', revenue: 3080, sessions: 24 },
];

export const RETENTION_CHART_DATA = [
  { month: 'Nov', rate: 82 },
  { month: 'Dez', rate: 75 },
  { month: 'Jan', rate: 80 },
  { month: 'Fev', rate: 83 },
  { month: 'Mar', rate: 81 },
  { month: 'Abr', rate: 78 },
];

// Helpers
export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function getStatusLabel(status: StudentStatus) {
  const map: Record<StudentStatus, string> = {
    active: 'Ativo',
    at_risk: 'Em risco',
    churned: 'Inativo',
    new: 'Novo',
  };
  return map[status];
}

export function getPlanLabel(plan: Student['plan']) {
  const map = { basic: 'Basic', premium: 'Premium', elite: 'Elite' };
  return map[plan];
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr + 'T00:00:00').getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
