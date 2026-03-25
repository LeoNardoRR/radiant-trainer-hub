import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const weeklyData = [
  { day: "Seg", sessions: 5, target: 6 },
  { day: "Ter", sessions: 4, target: 6 },
  { day: "Qua", sessions: 6, target: 6 },
  { day: "Qui", sessions: 3, target: 5 },
  { day: "Sex", sessions: 5, target: 6 },
  { day: "Sáb", sessions: 2, target: 3 },
];

const metrics = [
  { label: "Taxa de presença", value: "92%", change: "+5%", positive: true },
  { label: "Retenção mensal", value: "88%", change: "+2%", positive: true },
  { label: "Média semanal/aluno", value: "3.2x", change: "+0.4", positive: true },
  { label: "Cancelamentos", value: "4", change: "-2", positive: true },
];

const popularHours = [
  { hour: "07:00", pct: 95 },
  { hour: "08:00", pct: 88 },
  { hour: "09:00", pct: 82 },
  { hour: "14:00", pct: 65 },
  { hour: "16:00", pct: 78 },
  { hour: "17:00", pct: 70 },
  { hour: "18:00", pct: 55 },
];

const AnalyticsPage = () => {
  const maxSessions = Math.max(...weeklyData.map((d) => d.target));

  return (
    <AppLayout>
      <div className="space-y-10">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">ANALYTICS</p>
          <h1 className="font-display font-light text-3xl tracking-tight">Visão geral</h1>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 1}
              className="bg-background p-6"
            >
              <p className="font-display font-light text-3xl mb-1">{m.value}</p>
              <p className="text-editorial-sm text-muted-foreground mb-2">{m.label}</p>
              <span className={`text-editorial-sm ${m.positive ? "text-success" : "text-risk"}`}>
                {m.change}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly chart */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="card-editorial">
            <p className="text-editorial-sm text-muted-foreground mb-8">SESSÕES DA SEMANA</p>
            <div className="flex items-end gap-3 h-48">
              {weeklyData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative flex-1 flex items-end">
                    {/* Target */}
                    <div
                      className="absolute inset-x-0 bottom-0 border border-dashed border-border"
                      style={{ height: `${(d.target / maxSessions) * 100}%` }}
                    />
                    {/* Actual */}
                    <div
                      className="relative w-full bg-foreground/10 transition-all duration-500"
                      style={{ height: `${(d.sessions / maxSessions) * 100}%` }}
                    />
                  </div>
                  <span className="text-editorial-sm text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-foreground/10" />
                <span className="text-xs font-body text-muted-foreground">Realizadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 border border-dashed border-border" />
                <span className="text-xs font-body text-muted-foreground">Meta</span>
              </div>
            </div>
          </motion.div>

          {/* Popular hours */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="card-editorial">
            <p className="text-editorial-sm text-muted-foreground mb-8">HORÁRIOS MAIS UTILIZADOS</p>
            <div className="space-y-4">
              {popularHours.map((h) => (
                <div key={h.hour} className="flex items-center gap-4">
                  <span className="font-display text-sm w-14 shrink-0 text-muted-foreground">{h.hour}</span>
                  <div className="flex-1 h-1.5 bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${h.pct}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-foreground/30"
                    />
                  </div>
                  <span className="text-xs font-display text-muted-foreground w-10 text-right">{h.pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;
