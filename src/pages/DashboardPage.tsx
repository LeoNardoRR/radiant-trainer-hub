import { motion } from "framer-motion";
import {
  Calendar, Users, TrendingUp, AlertTriangle, CheckCircle2,
  ArrowRight, Clock, Sparkles, Flame, Trophy,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useUpdateSessionStatus } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserStreak } from "@/hooks/useGamification";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import ProgressSection from "@/components/ProgressSection";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const DashboardPage = () => {
  const { profile, role } = useAuth();
  const { data: sessions } = useSessions();
  const { data: students } = useStudents();
  const { data: notifications } = useNotifications();
  const { data: streak } = useUserStreak();
  const updateStatus = useUpdateSessionStatus();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const todaySessions = sessions?.filter((s) => s.date === todayStr) || [];
  const pendingSessions = sessions?.filter((s) => s.status === "pending") || [];
  const weekSessions = sessions?.filter((s) => {
    const d = parseISO(s.date);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return d >= weekStart && d < weekEnd;
  }) || [];

  const completedWeek = weekSessions.filter((s) => s.status === "completed").length;
  const totalWeek = weekSessions.length;
  const presenceRate = totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 0;
  const activeStudents = students?.filter((s) => s.status === "active").length || 0;
  const atRiskStudents = students?.filter((s) => s.status === "at_risk").length || 0;

  const recentAlerts = notifications?.slice(0, 3) || [];

  const trainerStats = [
    { label: "Sessões da semana", value: String(weekSessions.length), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Taxa de presença", value: `${presenceRate}%`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Alunos ativos", value: String(activeStudents), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Em risco", value: String(atRiskStudents), icon: AlertTriangle, color: atRiskStudents > 0 ? "text-warning" : "text-success", bg: atRiskStudents > 0 ? "bg-warning/10" : "bg-success/10" },
  ];

  const studentStats = [
    { label: "Sessões da semana", value: String(weekSessions.length), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Sequência", value: `${streak?.current_streak || 0}🔥`, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
    { label: "Treinos totais", value: String(streak?.total_workouts || 0), icon: Trophy, color: "text-success", bg: "bg-success/10" },
    { label: "Pendentes", value: String(pendingSessions.length), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  const stats = role === "trainer" ? trainerStats : studentStats;

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {role === "trainer" ? "DASHBOARD" : "MEU PAINEL"}
            </p>
          </div>
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight">
            {greeting()}, {profile?.full_name?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i + 1} />
          ))}
        </div>

        {/* Student: Progress Section */}
        {role === "student" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <ProgressSection />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today's Schedule */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">AGENDA DE HOJE</p>
              </div>
              <Link to="/schedule" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 min-h-[44px] px-2">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl mb-2 block">📅</span>
                <p className="text-sm text-muted-foreground">Nenhuma sessão hoje</p>
              </div>
            ) : (
              <div className="space-y-0">
                {todaySessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 py-3 border-t border-border min-h-[52px]">
                    <span className="text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg w-14 text-center">
                      {session.start_time?.slice(0, 5)}
                    </span>
                    <span className="text-sm flex-1 truncate font-medium">
                      {(session.student as any)?.full_name || (session.trainer as any)?.full_name || "—"}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      session.status === "approved" ? "text-success" :
                      session.status === "pending" ? "text-warning" :
                      session.status === "completed" ? "text-primary" : "text-risk"
                    }`}>
                      {session.status === "approved" ? "✓" :
                       session.status === "pending" ? "⏳" :
                       session.status === "completed" ? "✓✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pending Requests - Trainer only */}
          {role === "trainer" && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
              className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 hover:border-warning/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">PENDENTES</p>
                </div>
                {pendingSessions.length > 0 && (
                  <span className="text-xs font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full">{pendingSessions.length}</span>
                )}
              </div>
              {pendingSessions.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="text-3xl mb-2 block">✅</span>
                  <p className="text-sm text-muted-foreground">Tudo em dia!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {pendingSessions.slice(0, 4).map((req) => (
                    <div key={req.id} className="py-3 border-t border-border">
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{(req.student as any)?.full_name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(parseISO(req.date), "EEE, dd/MM", { locale: ptBR })} · {req.start_time?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: req.id, status: "approved", student_id: req.student_id })}
                          className="flex-1 h-9 text-xs bg-success hover:bg-success/90 text-success-foreground rounded-xl">
                          ✓ Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: req.id, status: "rejected", student_id: req.student_id })}
                          className="flex-1 h-9 text-xs border-risk/30 text-risk hover:bg-risk hover:text-risk-foreground rounded-xl">
                          ✗ Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Alerts */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 hover:border-accent-foreground/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">ALERTAS</p>
              </div>
              <Link to="/notifications" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 min-h-[44px] px-2">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl mb-2 block">🔔</span>
                <p className="text-sm text-muted-foreground">Nenhum alerta</p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 py-3 border-t border-border min-h-[52px]">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.type === "retention" ? "bg-warning/10" :
                      alert.type === "achievement" ? "bg-success/10" : "bg-primary/10"
                    }`}>
                      {alert.type === "retention" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" strokeWidth={1.8} />
                      ) : alert.type === "achievement" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.8} />
                      ) : (
                        <Calendar className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate font-medium">{alert.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
