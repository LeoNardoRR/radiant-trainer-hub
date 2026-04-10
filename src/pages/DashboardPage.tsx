import { motion } from "framer-motion";
import {
  Calendar, Users, TrendingUp, AlertTriangle, CheckCircle2,
  ArrowRight, Clock, Flame, Trophy, Target, Zap,
  ChevronRight, Activity, Award, BarChart3,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useUpdateSessionStatus } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserStreak, useUserBadges, useBadges } from "@/hooks/useGamification";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const DashboardPage = () => {
  const { profile, role, user } = useAuth();
  const { data: sessions } = useSessions();
  const { data: students } = useStudents();
  const { data: notifications } = useNotifications();
  const { data: streak } = useUserStreak();
  const { data: userBadges } = useUserBadges();
  const { data: allBadges } = useBadges();
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

  const totalWorkouts = streak?.total_workouts || 0;
  const level = totalWorkouts >= 100 ? 5 : totalWorkouts >= 50 ? 4 : totalWorkouts >= 25 ? 3 : totalWorkouts >= 10 ? 2 : 1;
  const levelNames = ["Novato", "Regular", "Dedicado", "Veterano", "Lenda"];
  const levelEmojis = ["🌱", "⚡", "🔥", "💎", "👑"];
  const levelThresholds = [0, 10, 25, 50, 100];
  const nextThreshold = levelThresholds[level] || 100;
  const prevThreshold = levelThresholds[level - 1] || 0;
  const levelProgress = nextThreshold > prevThreshold
    ? Math.min(100, Math.round(((totalWorkouts - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
    : 100;

  const earnedCount = userBadges?.length || 0;

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const nextSession = todaySessions.find((s) => s.status === "approved" || s.status === "pending");

  // ─── STUDENT DASHBOARD (Strava-inspired) ───
  if (role === "student") {
    return (
      <AppLayout>
        <div className="space-y-5">
          {/* Hero header */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8" />
            <div className="relative z-10">
              <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-widest">
                {format(today, "EEEE, dd MMM", { locale: ptBR })}
              </p>
              <h1 className="text-2xl font-bold mt-1 tracking-tight">
                {greeting()}, {profile?.full_name?.split(" ")[0]} 👋
              </h1>
              {nextSession && (
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-primary-foreground/70 font-semibold">PRÓXIMO TREINO</p>
                    <p className="text-sm font-bold">{nextSession.start_time?.slice(0, 5)} — {nextSession.session_type || "Treino"}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary-foreground/50" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Streak + Level row */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-warning/5 rounded-full" />
              <Flame className="h-6 w-6 text-warning mb-2" />
              <p className="text-3xl font-black tracking-tight">{streak?.current_streak || 0}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                dias seguidos
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Recorde: {streak?.longest_streak || 0}
              </p>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/5 rounded-full" />
              <span className="text-2xl block mb-1">{levelEmojis[level - 1]}</span>
              <p className="text-lg font-black tracking-tight">{levelNames[level - 1]}</p>
              <Progress value={levelProgress} className="h-1.5 mt-2" />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {totalWorkouts}/{nextThreshold} treinos
              </p>
            </motion.div>
          </div>

          {/* Quick stats bar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="grid grid-cols-3 gap-2">
            {[
              { icon: Target, value: totalWorkouts, label: "Treinos", color: "text-primary" },
              { icon: Trophy, value: earnedCount, label: "Conquistas", color: "text-yellow-500" },
              { icon: Activity, value: `${presenceRate}%`, label: "Frequência", color: "text-success" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <stat.icon className={`h-4 w-4 mx-auto mb-1.5 ${stat.color}`} />
                <p className="text-xl font-black">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Today's classes */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HOJE</p>
              </div>
              <Link to="/schedule" className="text-xs text-primary font-bold flex items-center gap-0.5 min-h-[44px] px-2">
                Ver aulas <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-4xl block mb-2">🧘</span>
                <p className="text-sm font-semibold">Dia de descanso</p>
                <p className="text-xs text-muted-foreground mt-0.5">Nenhum treino agendado para hoje.</p>
              </div>
            ) : (
              <div>
                {todaySessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 min-h-[56px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      session.status === "approved" ? "bg-success/10" :
                      session.status === "completed" ? "bg-primary/10" :
                      session.status === "pending" ? "bg-warning/10" : "bg-muted"
                    }`}>
                      <Clock className={`h-4 w-4 ${
                        session.status === "approved" ? "text-success" :
                        session.status === "completed" ? "text-primary" :
                        session.status === "pending" ? "text-warning" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{session.start_time?.slice(0, 5)} — {session.end_time?.slice(0, 5)}</p>
                      <p className="text-xs text-muted-foreground">{session.session_type || "Treino"}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      session.status === "approved" ? "text-success" :
                      session.status === "completed" ? "text-primary" :
                      session.status === "pending" ? "text-warning" : "text-risk"
                    }`}>
                      {session.status === "approved" ? "✓ OK" :
                       session.status === "completed" ? "✓✓" :
                       session.status === "pending" ? "⏳" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Badges */}
          {allBadges && allBadges.length > 0 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
              className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CONQUISTAS</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">{earnedCount}/{allBadges.length}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {allBadges.map((badge) => {
                  const earned = userBadges?.some((ub) => (ub as any).badge?.id === badge.id || (ub as any).badge_id === badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                        earned ? "bg-yellow-500/10 border border-yellow-500/20" : "opacity-25"
                      }`}
                      title={`${badge.name}: ${badge.description}`}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <p className="text-[9px] text-center font-semibold leading-tight truncate w-full">{badge.name}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Ranking CTA */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
            <Link to="/leaderboard"
              className="flex items-center gap-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-4 hover:border-yellow-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Ranking</p>
                <p className="text-xs text-muted-foreground">Veja sua posição entre os alunos</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
            </Link>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // ─── TRAINER DASHBOARD ───
  const recentAlerts = notifications?.slice(0, 3) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">DASHBOARD</p>
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight">
            {greeting()}, {profile?.full_name?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Sessões da semana", value: String(weekSessions.length), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
            { label: "Taxa de presença", value: `${presenceRate}%`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
            { label: "Alunos ativos", value: String(activeStudents), icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Em risco", value: String(atRiskStudents), icon: AlertTriangle, color: atRiskStudents > 0 ? "text-warning" : "text-success", bg: atRiskStudents > 0 ? "bg-warning/10" : "bg-success/10" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
              className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-all">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-[18px] w-[18px] ${stat.color}`} strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-black tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HOJE</p>
              </div>
              <Link to="/schedule" className="text-xs text-primary font-bold flex items-center gap-0.5 min-h-[44px] px-2">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl block mb-2">📅</span>
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
                      {(session.student as any)?.full_name || "—"}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${
                      session.status === "approved" ? "text-success" :
                      session.status === "pending" ? "text-warning" :
                      session.status === "completed" ? "text-primary" : "text-risk"
                    }`}>
                      {session.status === "approved" ? "✓" : session.status === "pending" ? "⏳" : session.status === "completed" ? "✓✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pending */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PENDENTES</p>
              </div>
              {pendingSessions.length > 0 && (
                <span className="text-xs font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full">{pendingSessions.length}</span>
              )}
            </div>
            {pendingSessions.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl block mb-2">✅</span>
                <p className="text-sm text-muted-foreground">Tudo em dia!</p>
              </div>
            ) : (
              <div className="space-y-0">
                {pendingSessions.slice(0, 4).map((req) => (
                  <div key={req.id} className="py-3 border-t border-border">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold">{(req.student as any)?.full_name}</p>
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

          {/* Alerts */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
            className="lg:col-span-1 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ALERTAS</p>
              </div>
              <Link to="/notifications" className="text-xs text-primary font-bold flex items-center gap-0.5 min-h-[44px] px-2">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-3xl block mb-2">🔔</span>
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
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      ) : alert.type === "achievement" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate font-semibold">{alert.title}</p>
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
