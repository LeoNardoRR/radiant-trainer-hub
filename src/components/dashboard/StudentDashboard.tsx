import { motion } from "framer-motion";
import { ArrowRight, Trophy, Flame } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import { useUserStreak, useUserBadges, useLeaderboard } from "@/hooks/useGamification";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

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

export function greeting(name?: string) {
  const h = new Date().getHours();
  const period = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${period}, ${name.split(" ")[0]}` : period;
}

export const StudentDashboard = () => {
  const { profile, user } = useAuth();
  const { data: sessions, isLoading: sessLoading }    = useSessions();
  const { data: streak,     isLoading: strkLoading }  = useUserStreak();
  const { data: userBadges, isLoading: ubLoading }    = useUserBadges();
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

  return (
    <AppLayout>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[140px] w-full rounded-2xl" />
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-[88px] w-full rounded-2xl" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-[100px] rounded-2xl" />
              <Skeleton className="h-[100px] rounded-2xl" />
              <Skeleton className="h-[100px] rounded-2xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[92px] rounded-2xl" />
            <Skeleton className="h-[92px] rounded-2xl" />
          </div>
          <Skeleton className="h-[160px] w-full rounded-2xl" />
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
            <div className="relative overflow-hidden card-base px-5 py-4 mb-3 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
                <span className="text-xl font-black text-primary">#{myRank + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-bold tracking-tight">Sua posição atual</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <strong className="text-foreground">{myEntry.score}</strong> pontos globais
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-muted px-3 py-1.5 rounded-xl border border-border/50">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-black text-foreground">{myEntry.current_streak}</span>
              </div>
            </div>
          )}

          {/* Mini podium — 3 colunas */}
          {top3.length >= 2 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {podiumOrder.map((podiumIdx) => {
                const entry = top3[podiumIdx];
                if (!entry) return <div key={podiumIdx} />;
                const isMe = entry.user_id === user?.id;
                
                return (
                  <div key={entry.user_id}
                    className={`card-base p-3 flex flex-col items-center gap-1.5 ${
                      podiumIdx === 0 ? "-mt-2" : ""
                    } ${isMe ? "border-primary/40 bg-primary/5" : ""}`}>
                    <span className="text-xs font-black text-muted-foreground">#{podiumIdx + 1}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[11px] font-bold truncate w-full text-center leading-tight">
                      {entry.name.split(" ")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{entry.score} pts</p>
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
      </motion.div>
      )}
    </AppLayout>
  );
};
