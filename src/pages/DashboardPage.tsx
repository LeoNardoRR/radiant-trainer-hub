import { motion } from "framer-motion";
import { ArrowRight, CheckCheck, X, AlertTriangle, Trophy, Flame, Crown, Medal } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Leaderboard hook (inline, same as LeaderboardPage) ──────
const useLeaderboard = () => {
  const { user, role, profile } = useAuth();
  return useQuery({
    queryKey: ["leaderboard", profile?.trainer_id, user?.id],
    queryFn: async () => {
      const trainerId = role === "trainer" ? user!.id : profile?.trainer_id;
      if (!trainerId) return [];
      const { data: students } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("trainer_id", trainerId)
        .eq("status", "active");
      if (!students || students.length === 0) return [];
      const studentIds = students.map((s) => s.user_id);
      const { data: streaks } = await supabase.from("user_streaks").select("*").in("user_id", studentIds);
      const { data: badges }  = await supabase.from("user_badges").select("user_id, badge_id").in("user_id", studentIds);
      const badgeCounts: Record<string, number> = {};
      badges?.forEach((b) => { badgeCounts[b.user_id] = (badgeCounts[b.user_id] || 0) + 1; });
      const streakMap: Record<string, any> = {};
      streaks?.forEach((s) => { streakMap[s.user_id] = s; });
      return students
        .map((s) => ({
          user_id: s.user_id,
          name: s.full_name,
          total_workouts: streakMap[s.user_id]?.total_workouts || 0,
          current_streak: streakMap[s.user_id]?.current_streak || 0,
          badges: badgeCounts[s.user_id] || 0,
          score: (streakMap[s.user_id]?.total_workouts || 0) * 10 +
                 (streakMap[s.user_id]?.current_streak  || 0) * 5  +
                 (badgeCounts[s.user_id]               || 0) * 20,
        }))
        .sort((a, b) => b.score - a.score);
    },
    enabled: !!user,
  });
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const statusColors: Record<string, string> = {
  approved:  "text-success",
  completed: "text-primary",
  pending:   "text-warning",
  rejected:  "text-risk",
  cancelled: "text-muted-foreground",
  missed:    "text-risk",
};
const statusLabels: Record<string, string> = {
  approved: "Confirmado", completed: "Concluído",
  pending: "Pendente", rejected: "Recusado",
  cancelled: "Cancelado", missed: "Faltou",
};

// ─── Greeting ────────────────────────────────────────────────
function greeting(name?: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${period}, ${name.split(" ")[0]}` : period;
}

// ─── STUDENT DASHBOARD ───────────────────────────────────────
const StudentDashboard = () => {
  const { profile, user } = useAuth();
  const { data: sessions, isLoading: sessLoading }    = useSessions();
  const { data: streak,     isLoading: strkLoading }  = useUserStreak();
  const { data: userBadges, isLoading: ubLoading }    = useUserBadges();
  const { data: allBadges }  = useBadges();
  const { data: leaderboard, isLoading: lbLoading }   = useLeaderboard();

  const isLoading = sessLoading || strkLoading || ubLoading || lbLoading;

  const today    = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const todaySessions   = sessions?.filter((s) => s.date === todayStr) ?? [];
  const totalWorkouts   = streak?.total_workouts  ?? 0;
  const currentStreak   = streak?.current_streak  ?? 0;
  const longestStreak   = streak?.longest_streak  ?? 0;
  const earnedCount     = userBadges?.length ?? 0;

  const levelThresholds = [0, 10, 25, 50, 100];
  const level = totalWorkouts >= 100 ? 4 : totalWorkouts >= 50 ? 3 : totalWorkouts >= 25 ? 2 : totalWorkouts >= 10 ? 1 : 0;
  const levelNames      = ["Iniciante", "Regular", "Dedicado", "Veterano", "Elite"];
  const nextThreshold   = levelThresholds[level + 1] ?? 100;
  const prevThreshold   = levelThresholds[level] ?? 0;
  const levelProgress   = nextThreshold > prevThreshold
    ? Math.min(100, Math.round(((totalWorkouts - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
    : 100;

  const nextSession = todaySessions.find((s) => s.status === "approved" || s.status === "pending");

  // Ranking data
  const myRank     = leaderboard?.findIndex((e) => e.user_id === user?.id) ?? -1;
  const myEntry    = myRank >= 0 ? leaderboard![myRank] : null;
  const top3       = leaderboard?.slice(0, 3) ?? [];
  const podiumOrder = [1, 0, 2]; // silver, gold, bronze layout

  const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-500"];
  const rankBgs    = ["bg-yellow-400/15", "bg-slate-400/15", "bg-amber-500/15"];
  const RankIcons  = [Crown, Medal, Medal];

  return (
    <AppLayout>
      {isLoading ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary/20 animate-pulse h-36" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2].map(i=><div key={i} className="h-28 rounded-2xl bg-muted/60 animate-pulse" />)}
          </div>
          {[1,2,3].map(i=><div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />)}
        </div>
      ) : (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">

        {/* ── Hero ------------------------------------------------ */}
        <motion.div variants={item}
          className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/8" />
          <div className="pointer-events-none absolute -bottom-6 left-12 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-[11px] font-semibold text-primary-foreground/60 uppercase tracking-widest mb-1">
              {format(today, "EEEE, d MMM", { locale: ptBR })}
            </p>
            <h1 className="text-[1.6rem] font-black tracking-tight leading-tight">
              {greeting(profile?.full_name)}
            </h1>
            {nextSession ? (
              <div className="mt-4 flex items-center gap-3 bg-black/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest">Próximo treino</p>
                  <p className="text-sm font-bold mt-0.5">
                    {nextSession.start_time?.slice(0, 5)}
                    {nextSession.session_type && <span className="font-normal opacity-70"> · {nextSession.session_type}</span>}
                  </p>
                </div>
                <Link to="/schedule" className="ml-auto press-scale">
                  <ArrowRight className="h-5 w-5 text-primary-foreground/60" />
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-primary-foreground/60">Nenhum treino hoje — dia de descanso!</p>
            )}
          </div>
        </motion.div>

        {/* ── RANKING — destaque total ─────────────────────────── */}
        <motion.div variants={item}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <p className="label-overline">Ranking</p>
            </div>
            <Link to="/leaderboard" className="text-[11px] font-bold text-primary flex items-center gap-0.5 min-h-[44px] px-2 -mr-2">
              Ver completo <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          {/* My position — hero card */}
          {myEntry && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/5 to-transparent border border-yellow-500/25 px-5 py-4 mb-3 flex items-center gap-4">
              <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-yellow-400/5 to-transparent" />
              {/* Rank badge */}
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                myRank === 0 ? "bg-yellow-400/20" : myRank === 1 ? "bg-slate-400/20" : myRank === 2 ? "bg-amber-500/20" : "bg-primary/10"
              }`}>
                {myRank < 3 ? (
                  <>
                    {myRank === 0 && <Crown className="h-5 w-5 text-yellow-500 mb-0.5" />}
                    {myRank > 0  && <Medal className={`h-5 w-5 mb-0.5 ${myRank === 1 ? "text-slate-400" : "text-amber-500"}`} />}
                    <span className={`text-xs font-black ${rankColors[myRank]}`}>#{myRank + 1}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-black text-primary">#{myRank + 1}</span>
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-black tracking-tight">Sua posição</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <strong className="text-foreground">{myEntry.score}</strong> pontos · <strong className="text-foreground">{myEntry.total_workouts}</strong> treinos
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Flame className="h-5 w-5 text-warning" />
                <span className="text-xl font-black text-warning">{myEntry.current_streak}</span>
              </div>
            </div>
          )}

          {/* Mini podium — 3 colunas */}
          {top3.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {podiumOrder.map((podiumIdx) => {
                const entry = top3[podiumIdx];
                if (!entry) return <div key={podiumIdx} />;
                const isMe       = entry.user_id === user?.id;
                const RankIcon   = RankIcons[podiumIdx];
                return (
                  <div key={entry.user_id}
                    className={`card-base p-3 text-center flex flex-col items-center gap-1.5 ${
                      podiumIdx === 0 ? "-mt-3 shadow-lg border-yellow-400/25" : ""
                    } ${isMe ? "border-primary/40 bg-primary/5" : ""}`}>
                    <RankIcon className={`h-4 w-4 ${rankColors[podiumIdx]}`} />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                      isMe ? "bg-primary/15 text-primary" : rankBgs[podiumIdx]+" "+rankColors[podiumIdx]
                    }`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[11px] font-bold truncate w-full leading-tight">
                      {entry.name.split(" ")[0]}{isMe ? " 👤" : ""}
                    </p>
                    <p className={`text-[10px] font-black ${rankColors[podiumIdx]}`}>{entry.score} pts</p>
                    <div className="flex items-center gap-0.5 text-warning">
                      <Flame className="h-2.5 w-2.5" />
                      <span className="text-[10px] font-bold">{entry.current_streak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mini list — positions 4-6 */}
          {(leaderboard?.length ?? 0) > 3 && (
            <div className="card-base overflow-hidden">
              {leaderboard!.slice(3, 6).map((entry, i) => {
                const rank = i + 4;
                const isMe = entry.user_id === user?.id;
                return (
                  <div key={entry.user_id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 min-h-[48px] ${isMe ? "bg-primary/5" : ""}`}>
                    <span className="text-xs font-black text-muted-foreground w-6 text-center">{rank}º</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                      isMe ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <p className={`flex-1 text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                      {entry.name.split(" ")[0]}{isMe ? " (você)" : ""}
                    </p>
                    <span className="text-xs font-bold">{entry.score} pts</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!leaderboard || leaderboard.length === 0 && (
            <div className="card-base py-8 text-center">
              <Trophy className="h-8 w-8 text-yellow-500/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sem dados de ranking ainda.</p>
            </div>
          )}
        </motion.div>

        {/* ── Streak + Level ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={item} className="card-base p-4">
            <p className="label-overline mb-3">Sequência</p>
            <p className="stat-value text-primary">{currentStreak}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              dias • recorde&nbsp;<strong>{longestStreak}</strong>
            </p>
          </motion.div>

          <motion.div variants={item} className="card-base p-4">
            <p className="label-overline mb-3">Nível</p>
            <p className="text-xl font-black tracking-tight">{levelNames[level]}</p>
            <Progress value={levelProgress} className="h-1.5 mt-2.5 mb-1" />
            <p className="text-[10px] text-muted-foreground">
              {totalWorkouts} / {nextThreshold} treinos
            </p>
          </motion.div>
        </div>

        {/* ── Today's sessions ─────────────────────────────────── */}
        <motion.div variants={item} className="card-base overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
              <p className="label-overline">Hoje</p>
            </div>
            <Link to="/schedule" className="text-[11px] font-bold text-primary flex items-center gap-0.5 min-h-[44px] px-2 -mr-2">
              Ver agenda <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-muted-foreground">Nenhuma sessão hoje</p>
            </div>
          ) : (
            todaySessions.map((s) => (
              <div key={s.id}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-border/60 last:border-b-0 min-h-[56px]">
                <span className="text-sm font-bold text-primary w-11 shrink-0">{s.start_time?.slice(0, 5)}</span>
                <span className="flex-1 text-sm font-semibold truncate">{s.session_type || "Treino"}</span>
                <span className={`text-[11px] font-bold ${statusColors[s.status]}`}>{statusLabels[s.status]}</span>
              </div>
            ))
          )}
        </motion.div>

        {/* ── Badges ─────────────────────────────────────────────── */}
        {allBadges && allBadges.length > 0 && (
          <motion.div variants={item} className="card-base p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="label-overline">Conquistas</p>
              <span className="text-[10px] font-bold text-muted-foreground">{earnedCount}/{allBadges.length}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {allBadges.slice(0, 10).map((badge) => {
                const earned = userBadges?.some(
                  (ub) => (ub as any).badge?.id === badge.id || (ub as any).badge_id === badge.id
                );
                return (
                  <div key={badge.id} title={badge.name}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      earned ? "bg-warning/10" : "opacity-25"
                    }`}>
                    <span className="text-xl">{badge.icon}</span>
                    <p className="text-[8px] font-semibold text-center leading-tight line-clamp-1">{badge.name}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
      )}
    </AppLayout>
  );
};

// ─── TRAINER DASHBOARD ───────────────────────────────────────
const TrainerDashboard = () => {
  const { profile } = useAuth();
  const { data: sessions,      isLoading: sessLoading }   = useSessions();
  const { data: students,      isLoading: studLoading }   = useStudents();
  const { data: notifications, isLoading: notifLoading }  = useNotifications();
  const updateStatus = useUpdateSessionStatus();

  const isLoading = sessLoading || studLoading || notifLoading;

  const today    = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const todaySessions = sessions?.filter((s) => s.date === todayStr) ?? [];
  const pendingSessions = sessions?.filter((s) => s.status === "pending") ?? [];

  const weekSessions = sessions?.filter((s) => {
    const d = parseISO(s.date);
    const ws = new Date(today); ws.setDate(today.getDate() - today.getDay());
    const we = new Date(ws);   we.setDate(ws.getDate() + 7);
    return d >= ws && d < we;
  }) ?? [];

  const completedWeek  = weekSessions.filter((s) => s.status === "completed").length;
  const presenceRate   = weekSessions.length > 0 ? Math.round((completedWeek / weekSessions.length) * 100) : 0;
  const activeStudents = students?.filter((s) => s.status === "active").length ?? 0;
  const atRiskStudents = students?.filter((s) => s.status === "at_risk").length ?? 0;

  const recentAlerts = notifications?.slice(0, 3) ?? [];

  return (
    <AppLayout>
      {isLoading ? (
        <div className="space-y-5">
          <div className="space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i=><div key={i} className="h-24 rounded-2xl bg-muted/60 animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i=><div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">

        {/* ── Greeting ---------------------------------------- */}
        <motion.div variants={item}>
          <p className="label-overline mb-1">{format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="text-[1.75rem] font-black tracking-tight leading-tight">
            {greeting(profile?.full_name)}
          </h1>
        </motion.div>

        {/* ── Key metrics ------------------------------------- */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: weekSessions.length, label: "Sessões / semana",  accent: false },
            { value: `${presenceRate}%`,  label: "Taxa de presença",  accent: presenceRate < 70 },
            { value: activeStudents,      label: "Alunos ativos",     accent: false },
            { value: atRiskStudents,      label: "Em risco",          accent: atRiskStudents > 0 },
          ].map((stat) => (
            <div key={stat.label} className={`card-base p-4 ${stat.accent ? "border-warning/30" : ""}`}>
              <p className={`stat-value ${stat.accent ? "text-warning" : ""}`}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-1.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Three column grid (stacks on mobile) ------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Today */}
          <motion.div variants={item} className="card-base overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                <p className="label-overline">Hoje</p>
              </div>
              <Link to="/schedule"
                className="text-[11px] font-bold text-primary flex items-center gap-0.5 min-h-[44px] px-2 -mr-2">
                Ver tudo <ArrowRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            {todaySessions.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma sessão hoje</p>
              </div>
            ) : (
              todaySessions.map((s) => (
                <div key={s.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 min-h-[52px]">
                  <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg tabular-nums shrink-0">
                    {s.start_time?.slice(0, 5)}
                  </span>
                  <span className="flex-1 text-sm font-semibold truncate">
                    {(s.student as any)?.full_name ?? "—"}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColors[s.status]}`}>
                    {s.status === "approved" ? "OK" :
                     s.status === "completed" ? "Feito" :
                     s.status === "pending"   ? "Aguard." : "Recus."}
                  </span>
                </div>
              ))
            )}
          </motion.div>

          {/* Pending approvals */}
          <motion.div variants={item} className="card-base overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
                <p className="label-overline">Solicitações</p>
              </div>
              {pendingSessions.length > 0 && (
                <span className="badge bg-warning/10 text-warning">{pendingSessions.length}</span>
              )}
            </div>

            {pendingSessions.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCheck className="h-8 w-8 text-success/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tudo em dia!</p>
              </div>
            ) : (
              pendingSessions.slice(0, 4).map((req) => (
                <div key={req.id} className="px-4 py-3 border-b border-border/50 last:border-b-0">
                  <p className="text-sm font-bold truncate">{(req.student as any)?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(parseISO(req.date), "EEE dd/MM", { locale: ptBR })} · {req.start_time?.slice(0,5)}
                  </p>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => updateStatus.mutate({ id: req.id, status: "approved", student_id: req.student_id })}
                      className="flex-1 h-9 text-xs font-bold bg-success/10 text-success hover:bg-success hover:text-success-foreground rounded-xl transition-all press-scale">
                      Aprovar
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: req.id, status: "rejected", student_id: req.student_id })}
                      className="w-9 h-9 shrink-0 flex items-center justify-center bg-muted hover:bg-risk/10 hover:text-risk rounded-xl transition-all press-scale">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>

          {/* Alerts */}
          <motion.div variants={item} className="card-base overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-risk inline-block" />
                <p className="label-overline">Alertas</p>
              </div>
              <Link to="/notifications"
                className="text-[11px] font-bold text-primary flex items-center gap-0.5 min-h-[44px] px-2 -mr-2">
                Ver tudo <ArrowRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhum alerta</p>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 min-h-[52px]">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    alert.type === "retention" ? "bg-warning/10" : "bg-primary/10"
                  }`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${
                      alert.type === "retention" ? "text-warning" : "text-primary"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </div>

        {/* ── Quick links row ----------------------------------- */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Alunos em risco",   sublabel: `${atRiskStudents} alunos`, to: "/students", urgent: atRiskStudents > 0 },
            { label: "Solicitações",      sublabel: `${pendingSessions.length} pendentes`, to: "/schedule", urgent: pendingSessions.length > 0 },
            { label: "Financeiro",        sublabel: "Ver cobranças", to: "/payments", urgent: false },
            { label: "Analytics",         sublabel: "Relatórios", to: "/analytics", urgent: false },
          ].map((link) => (
            <Link key={link.to} to={link.to}
              className={`card-base px-4 py-4 flex flex-col gap-1 group press-scale ${
                link.urgent ? "border-warning/30 bg-warning/5" : ""
              }`}>
              <p className={`text-sm font-bold ${link.urgent ? "text-warning" : ""}`}>
                {link.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{link.sublabel}</p>
            </Link>
          ))}
        </motion.div>
      </motion.div>
      )}
    </AppLayout>
  );
};

// ─── Root ─────────────────────────────────────────────────────
const DashboardPage = () => {
  const { role } = useAuth();
  return role === "student" ? <StudentDashboard /> : <TrainerDashboard />;
};

export default DashboardPage;
