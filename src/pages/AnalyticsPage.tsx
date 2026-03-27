import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useSessions } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const AnalyticsPage = () => {
  const { data: sessions } = useSessions();
  const { data: students } = useStudents();

  const allSessions = sessions || [];
  const totalSessions = allSessions.length;
  const completed = allSessions.filter((s) => s.status === "completed").length;
  const cancelled = allSessions.filter((s) => s.status === "cancelled" || s.status === "rejected").length;
  const presenceRate = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;
  const activeStudents = students?.filter((s) => s.status === "active").length || 0;
  const totalStudents = students?.length || 0;
  const retentionRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

  const hourCounts: Record<string, number> = {};
  allSessions.forEach((s) => {
    const h = s.start_time?.slice(0, 5) || "00:00";
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const popularHours = Object.entries(hourCounts).sort(([, a], [, b]) => b - a).slice(0, 7)
    .map(([hour, count]) => ({ hour, pct: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0 }));

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayCounts = Array(7).fill(0);
  allSessions.forEach((s) => { dayCounts[new Date(s.date).getDay()]++; });
  const maxDay = Math.max(...dayCounts, 1);

  const metrics = [
    { label: "Taxa de presença", value: `${presenceRate}%`, color: "text-primary", bg: "bg-primary/10" },
    { label: "Retenção", value: `${retentionRate}%`, color: "text-success", bg: "bg-success/10" },
    { label: "Total de sessões", value: String(totalSessions), color: "text-foreground", bg: "bg-accent" },
    { label: "Cancelamentos", value: String(cancelled), color: cancelled > 0 ? "text-risk" : "text-success", bg: cancelled > 0 ? "bg-risk/10" : "bg-success/10" },
  ];

  const barColors = ["bg-primary/20", "bg-success/20", "bg-warning/20", "bg-primary/20", "bg-success/20", "bg-warning/20", "bg-primary/20"];

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-1">ANALYTICS</p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Visão geral</h1>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
              className="bg-card border border-border rounded-xl p-4 md:p-5">
              <p className={`font-display font-bold text-2xl md:text-3xl mb-1 ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground font-body">{m.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* Sessions by day */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="card-editorial">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-editorial-sm text-xs">SESSÕES POR DIA</p>
            </div>
            {totalSessions === 0 ? (
              <p className="text-sm text-muted-foreground font-body py-12 text-center">
                Dados aparecerão conforme as sessões forem realizadas
              </p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {dayNames.map((name, i) => (
                  <div key={name} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative flex-1 flex items-end">
                      <div className={`w-full ${barColors[i]} rounded-t-md transition-all duration-500 min-h-[2px]`}
                        style={{ height: `${(dayCounts[i] / maxDay) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-display text-muted-foreground font-medium">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Popular hours */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="card-editorial">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-success" />
              <p className="text-editorial-sm text-xs">HORÁRIOS POPULARES</p>
            </div>
            {popularHours.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body py-12 text-center">
                Dados aparecerão conforme as sessões forem realizadas
              </p>
            ) : (
              <div className="space-y-3">
                {popularHours.map((h) => (
                  <div key={h.hour} className="flex items-center gap-3">
                    <span className="font-display text-xs w-12 shrink-0 text-muted-foreground font-medium">{h.hour}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${h.pct}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-gradient-to-r from-primary to-success rounded-full" />
                    </div>
                    <span className="text-[10px] font-display text-muted-foreground w-8 text-right font-medium">{h.pct}%</span>
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

export default AnalyticsPage;
