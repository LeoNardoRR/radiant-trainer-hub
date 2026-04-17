import { motion } from "framer-motion";
import { ArrowRight, CheckCheck, X, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useUpdateSessionStatus } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { useNotifications } from "@/hooks/useNotifications";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { greeting } from "./StudentDashboard";

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

export const TrainerDashboard = () => {
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
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i=><Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1,2,3,4].map(i=><Skeleton key={i} className="h-[72px] rounded-2xl" />)}
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
                      aria-label="Recusar"
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
