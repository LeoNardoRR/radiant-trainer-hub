import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Clock, Sparkles } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useUpdateSessionStatus } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { useNotifications } from "@/hooks/useNotifications";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const DashboardPage = () => {
  const { profile, role } = useAuth();
  const { data: sessions } = useSessions();
  const { data: students } = useStudents();
  const { data: notifications } = useNotifications();
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
    { label: "Sessões esta semana", value: String(weekSessions.length), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Taxa de presença", value: `${presenceRate}%`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Alunos ativos", value: String(activeStudents), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Em risco", value: String(atRiskStudents), icon: AlertTriangle, color: atRiskStudents > 0 ? "text-warning" : "text-success", bg: atRiskStudents > 0 ? "bg-warning/10" : "bg-success/10" },
  ];

  const studentStats = [
    { label: "Sessões esta semana", value: String(weekSessions.length), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Sessões hoje", value: String(todaySessions.length), icon: Clock, color: "text-success", bg: "bg-success/10" },
    { label: "Pendentes", value: String(pendingSessions.length), icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
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
      <div className="space-y-6 md:space-y-8">
        {/* Header with greeting */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <p className="text-editorial-sm text-muted-foreground">
              {role === "trainer" ? "DASHBOARD" : "MEU PAINEL"}
            </p>
          </div>
          <h1 className="font-display font-semibold text-2xl md:text-4xl tracking-tight">
            {greeting()}, {profile?.full_name?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="font-body text-muted-foreground mt-1 text-sm">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className={`grid grid-cols-2 ${role === "trainer" ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 md:gap-4`}>
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i + 1} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {/* Today's Schedule */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-editorial-sm text-xs">AGENDA DE HOJE</p>
              </div>
              <Link to="/schedule" className="text-xs text-primary font-medium hover:underline flex items-center gap-1 min-h-[44px] px-2">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <div className="py-6 text-center">
                <span className="text-3xl mb-2 block">📅</span>
                <p className="text-sm text-muted-foreground font-body">Nenhuma sessão hoje</p>
              </div>
            ) : (
              <div className="space-y-0">
                {todaySessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 py-3 border-t border-border min-h-[52px]">
                    <div className="w-12 text-center">
                      <span className="font-display text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg">
                        {session.start_time?.slice(0, 5)}
                      </span>
                    </div>
                    <span className="font-body text-sm flex-1 truncate">
                      {(session.student as any)?.full_name || (session.trainer as any)?.full_name || "—"}
                    </span>
                    <span className={`status-badge ${
                      session.status === "approved" ? "status-approved" :
                      session.status === "pending" ? "status-pending" :
                      session.status === "completed" ? "status-approved" : "status-rejected"
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

          {/* Pending Requests */}
          {role === "trainer" && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
              className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 hover:border-warning/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <p className="text-editorial-sm text-xs">PENDENTES</p>
                </div>
                {pendingSessions.length > 0 && (
                  <span className="text-xs font-display font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full">{pendingSessions.length}</span>
                )}
              </div>
              {pendingSessions.length === 0 ? (
                <div className="py-6 text-center">
                  <span className="text-3xl mb-2 block">✅</span>
                  <p className="text-sm text-muted-foreground font-body">Tudo em dia!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {pendingSessions.slice(0, 4).map((req) => (
                    <div key={req.id} className="py-3 border-t border-border">
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0">
                          <p className="font-body text-sm font-medium">{(req.student as any)?.full_name}</p>
                          <p className="text-[11px] text-muted-foreground font-body">
                            {format(parseISO(req.date), "EEE, dd/MM", { locale: ptBR })} · {req.start_time?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: req.id, status: "approved", student_id: req.student_id })}
                          className="flex-1 h-9 text-xs bg-success hover:bg-success/90 text-success-foreground shadow-sm rounded-xl">
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
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5 hover:border-accent-foreground/20 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                <p className="text-editorial-sm text-xs">ALERTAS</p>
              </div>
              <Link to="/notifications" className="text-xs text-primary font-medium hover:underline flex items-center gap-1 min-h-[44px] px-2">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="py-6 text-center">
                <span className="text-3xl mb-2 block">🔔</span>
                <p className="text-sm text-muted-foreground font-body">Nenhum alerta</p>
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
                      <p className="font-body text-sm truncate">{alert.title}</p>
                      <p className="text-[11px] font-body text-muted-foreground truncate">{alert.message}</p>
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
