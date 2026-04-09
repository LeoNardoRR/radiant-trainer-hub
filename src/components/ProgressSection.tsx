import { motion } from "framer-motion";
import { Flame, Trophy, Target, Zap } from "lucide-react";
import { useUserStreak, useUserBadges, useBadges } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const ProgressSection = () => {
  const { user } = useAuth();
  const { data: streak } = useUserStreak();
  const { data: userBadges } = useUserBadges();
  const { data: allBadges } = useBadges();

  const earnedCount = userBadges?.length || 0;
  const totalBadges = allBadges?.length || 8;
  const progressPct = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;

  // Calculate level based on total workouts
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

  return (
    <div className="space-y-4">
      {/* Streak & Level Row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-warning" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sequência</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {streak?.current_streak || 0}
            <span className="text-base font-normal text-muted-foreground ml-1">dias</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Recorde: {streak?.longest_streak || 0} dias
          </p>
        </motion.div>

        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{levelEmojis[level - 1]}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nível</span>
          </div>
          <p className="text-lg font-bold tracking-tight mb-2">
            {levelNames[level - 1]}
          </p>
          <Progress value={levelProgress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {totalWorkouts}/{nextThreshold} treinos
          </p>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp} custom={2}
        className="grid grid-cols-3 gap-2"
      >
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Target className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{totalWorkouts}</p>
          <p className="text-[10px] text-muted-foreground">Treinos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Trophy className="h-4 w-4 text-warning mx-auto mb-1" />
          <p className="text-xl font-bold">{earnedCount}</p>
          <p className="text-[10px] text-muted-foreground">Conquistas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Zap className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="text-xl font-bold">{progressPct}%</p>
          <p className="text-[10px] text-muted-foreground">Progresso</p>
        </div>
      </motion.div>

      {/* Badges */}
      {allBadges && allBadges.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Conquistas</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {allBadges.map((badge) => {
              const earned = userBadges?.some((ub) => (ub as any).badge?.id === badge.id || (ub as any).badge_id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    earned ? "bg-warning/10" : "opacity-30"
                  }`}
                  title={`${badge.name}: ${badge.description}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="text-[9px] text-center font-medium leading-tight truncate w-full">
                    {badge.name}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressSection;
