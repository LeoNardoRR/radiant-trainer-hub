import { motion } from "framer-motion";
import {
  Calendar, TrendingUp, Users, XCircle, BarChart3,
  DollarSign, Award
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useSessions } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ── Skeleton loaders ──────────────────────────────────────────
const KpiSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <Skeleton className="h-3 w-24 mb-6" />
    <div className="flex items-end gap-3 h-44">
      {[60, 80, 45, 90, 70, 55, 40].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton className="w-full rounded-lg" style={{ height: `${h}%` }} />
          <Skeleton className="h-2 w-5" />
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsPage = () => {
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: payments, isLoading: paymentsLoading } = usePayments();

  const isLoading = sessionsLoading || studentsLoading || paymentsLoading;

  const allSessions    = sessions || [];
  const totalSessions  = allSessions.length;
  const completed      = allSessions.filter((s) => s.status === "completed").length;
  const cancelled      = allSessions.filter((s) => s.status === "cancelled" || s.status === "rejected").length;
  const presenceRate   = totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;
  const activeStudents = students?.filter((s) => s.status === "active").length || 0;
  const totalStudents  = students?.length || 0;
  const retentionRate  = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

  // Revenue per month (last 6 months)
  const revenueMonths = Array.from({ length: 6 }, (_, i) => {
    const d     = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d);
    const end   = endOfMonth(d);
    const label = format(d, "MMM", { locale: ptBR });
    const total = (payments || [])
      .filter((p: any) => {
        const pd = parseISO(p.due_date ?? p.paid_at ?? p.created_at ?? "2000-01-01");
        return pd >= start && pd <= end && p.status === "paid";
      })
      .reduce((acc: number, p: any) => acc + (p.amount ?? 0), 0);
    return { label, total };
  });
  const maxRevenue = Math.max(...revenueMonths.map((m) => m.total), 1);

  // Sessions by day of week
  const hourCounts: Record<string, number> = {};
  allSessions.forEach((s) => {
    const h = s.start_time?.slice(0, 5) || "00:00";
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const popularHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([hour, count]) => ({ hour, pct: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0 }));

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayCounts = Array(7).fill(0);
  allSessions.forEach((s) => { dayCounts[new Date(s.date).getDay()]++; });
  const maxDay = Math.max(...dayCounts, 1);

  // Attendance per student (top 8)
  const studentSessionMap: Record<string, { name: string; done: number; total: number }> = {};
  allSessions.forEach((s: any) => {
    const sid  = s.student_id;
    const name = s.student?.full_name ?? "—";
    if (!studentSessionMap[sid]) studentSessionMap[sid] = { name, done: 0, total: 0 };
    studentSessionMap[sid].total++;
    if (s.status === "completed") studentSessionMap[sid].done++;
  });
  const attendanceRanking = Object.values(studentSessionMap)
    .map((e) => ({ ...e, rate: e.total > 0 ? Math.round((e.done / e.total) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 8);

  const metrics = [
    { label: "Taxa de presença", value: `${presenceRate}%`,      icon: TrendingUp,  color: "text-success",  bg: "bg-success/10" },
    { label: "Retenção",         value: `${retentionRate}%`,     icon: Users,       color: "text-primary",  bg: "bg-primary/10" },
    { label: "Total de sessões", value: String(totalSessions),   icon: Calendar,    color: "text-foreground",bg: "bg-accent" },
    { label: "Cancelamentos",    value: String(cancelled),       icon: XCircle,     color: cancelled > 0 ? "text-risk" : "text-success", bg: cancelled > 0 ? "bg-risk/10" : "bg-success/10" },
  ];

  const barColors = [
    "from-primary/30 to-primary/60", "from-success/30 to-success/60",
    "from-warning/30 to-warning/60", "from-primary/30 to-primary/60",
    "from-success/30 to-success/60", "from-warning/30 to-warning/60",
    "from-primary/30 to-primary/60",
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Analytics</p>
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Visão geral</h1>
        </motion.div>

        {/* KPIs */}
        {isLoading ? <KpiSkeleton /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {metrics.map((m, i) => <StatCard key={m.label} {...m} index={i + 1} />)}
          </div>
        )}

        {!isLoading && totalSessions === 0 ? (
          <EmptyState icon={BarChart3} emoji="📊" title="Sem dados ainda"
            description="Os gráficos e estatísticas aparecerão conforme as sessões forem realizadas." />
        ) : (
          <>
            {/* Row 1 — Sessions by day + Popular hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              {isLoading ? (
                <><ChartSkeleton /><ChartSkeleton /></>
              ) : (
                <>
                  {/* Sessions by day */}
                  <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sessões por dia</p>
                    </div>
                    <div className="flex items-end gap-3 h-44">
                      {dayNames.map((name, i) => (
                        <div key={name} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full relative flex-1 flex items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(dayCounts[i] / maxDay) * 100}%` }}
                              transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              className={`w-full bg-gradient-to-t ${barColors[i]} rounded-lg min-h-[4px]`}
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-muted-foreground font-medium block">{name}</span>
                            <span className="text-[10px] font-bold text-foreground">{dayCounts[i]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Popular hours */}
                  <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-success/20 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Horários populares</p>
                    </div>
                    <div className="space-y-3">
                      {popularHours.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
                      ) : popularHours.map((h, i) => (
                        <div key={h.hour} className="flex items-center gap-3">
                          <span className="text-xs w-12 shrink-0 text-muted-foreground font-medium">{h.hour}</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${h.pct}%` }}
                              transition={{ delay: 0.5 + i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right font-medium">{h.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Row 2 — Revenue trend + Attendance ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              {isLoading ? (
                <><ChartSkeleton /><ChartSkeleton /></>
              ) : (
                <>
                  {/* Revenue per month */}
                  <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-warning/20 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Receita — últimos 6 meses</p>
                    </div>
                    {revenueMonths.every((m) => m.total === 0) ? (
                      <div className="flex flex-col items-center justify-center h-44 gap-2">
                        <DollarSign className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2 h-44">
                        {revenueMonths.map((m, i) => (
                          <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full relative flex-1 flex items-end">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(m.total / maxRevenue) * 100}%` }}
                                transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full bg-gradient-to-t from-warning/30 to-warning/70 rounded-lg min-h-[4px]"
                              />
                            </div>
                            <span className="text-[9px] capitalize text-muted-foreground font-medium">{m.label}</span>
                            {m.total > 0 && (
                              <span className="text-[9px] font-black text-warning">
                                R${m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : m.total}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Attendance ranking per student */}
                  <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Frequência por aluno</p>
                    </div>
                    {attendanceRanking.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-36 gap-2">
                        <Award className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {attendanceRanking.map((s, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-muted-foreground w-4 text-center">{i + 1}</span>
                            <p className="text-xs font-semibold w-28 truncate shrink-0">{s.name.split(" ")[0]}</p>
                            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.rate}%` }}
                                transition={{ delay: 0.4 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className={`h-full rounded-full ${s.rate >= 80 ? "bg-success" : s.rate >= 60 ? "bg-warning" : "bg-risk"}`}
                              />
                            </div>
                            <span className={`text-[10px] font-black w-8 text-right ${s.rate >= 80 ? "text-success" : s.rate >= 60 ? "text-warning" : "text-risk"}`}>
                              {s.rate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;
