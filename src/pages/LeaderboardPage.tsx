import { motion } from "framer-motion";
import { Trophy, Flame, Target, Medal, Crown } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/EmptyState";
import { useLeaderboard } from "@/hooks/useGamification";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};



const podiumColors = [
  "from-yellow-400/20 to-yellow-500/5 border-yellow-400/30",
  "from-slate-300/20 to-slate-400/5 border-slate-400/30",
  "from-amber-600/20 to-amber-700/5 border-amber-600/30",
];

const podiumIcons = [Crown, Medal, Medal];
const podiumTextColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useLeaderboard();

  const myRank = leaderboard?.findIndex((l) => l.user_id === user?.id);

  return (
    <AppLayout>
      <div className="space-y-5">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">COMPETIÇÃO</p>
          <h1 className="font-bold text-2xl tracking-tight">Ranking</h1>
          <p className="text-sm text-muted-foreground mt-1">Veja quem está mandando mais nos treinos 💪</p>
        </motion.div>

        {/* My position */}
        {myRank !== undefined && myRank >= 0 && leaderboard && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">#{myRank + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Sua posição</p>
                <p className="text-xs text-muted-foreground">
                  {leaderboard[myRank].score} pontos · {leaderboard[myRank].total_workouts} treinos
                </p>
              </div>
              <div className="flex items-center gap-1 text-warning">
                <Flame className="h-5 w-5" />
                <span className="text-lg font-bold">{leaderboard[myRank].current_streak}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Podium top 3 */}
        {leaderboard && leaderboard.length >= 3 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="grid grid-cols-3 gap-2">
              {[1, 0, 2].map((podiumIdx) => {
                const entry = leaderboard[podiumIdx];
                if (!entry) return null;
                const PodiumIcon = podiumIcons[podiumIdx];
                return (
                  <div
                    key={entry.user_id}
                    className={`bg-gradient-to-b ${podiumColors[podiumIdx]} border rounded-2xl p-3 text-center flex flex-col items-center ${
                      podiumIdx === 0 ? "pt-2 -mt-2" : "pt-4"
                    }`}
                  >
                    <PodiumIcon className={`h-5 w-5 mb-2 ${podiumTextColors[podiumIdx]}`} />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mb-2 ${
                      podiumIdx === 0 ? "bg-yellow-400/20 text-yellow-500" : podiumIdx === 1 ? "bg-slate-400/20 text-slate-400" : "bg-amber-600/20 text-amber-600"
                    }`}>
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-bold truncate w-full">{entry.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{entry.score} pts</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className="h-3 w-3 text-warning" />
                      <span className="text-[10px] font-bold">{entry.current_streak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Full list */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">CLASSIFICAÇÃO GERAL</p>
            </div>
            {!leaderboard || leaderboard.length === 0 ? (
              <EmptyState icon={Trophy} emoji="🏆" title="Sem competidores" description="Quando houver alunos ativos, o ranking aparecerá aqui." />
            ) : (
              <div>
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 min-h-[56px] transition-colors ${
                        isMe ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className={`w-8 text-center font-bold text-sm ${
                        idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-600" : "text-muted-foreground"
                      }`}>
                        {idx + 1}º
                      </span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isMe ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <span className="text-sm font-bold">{entry.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                          {entry.name} {isMe && "(Você)"}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Target className="h-3 w-3" /> {entry.total_workouts}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Flame className="h-3 w-3" /> {entry.current_streak}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Trophy className="h-3 w-3" /> {entry.badges}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground">{entry.score}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Scoring info */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <div className="bg-muted/30 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">COMO FUNCIONA</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Target className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xs font-bold">+10 pts</p>
                <p className="text-[10px] text-muted-foreground">por treino</p>
              </div>
              <div>
                <Flame className="h-4 w-4 text-warning mx-auto mb-1" />
                <p className="text-xs font-bold">+5 pts</p>
                <p className="text-[10px] text-muted-foreground">por dia de streak</p>
              </div>
              <div>
                <Trophy className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-xs font-bold">+20 pts</p>
                <p className="text-[10px] text-muted-foreground">por conquista</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default LeaderboardPage;
