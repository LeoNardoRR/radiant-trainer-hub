import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useUpdateSessionStatus } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { useNotifications } from "@/hooks/useNotifications";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const stats = [
    { label: "Sessões esta semana", value: String(weekSessions.length), icon: Calendar },
    { label: "Taxa de presença", value: `${presenceRate}%`, icon: TrendingUp },
    { label: "Alunos ativos", value: String(activeStudents), icon: Users },
    { label: "Em risco", value: String(atRiskStudents), icon: AlertTriangle },
  ];

  const handleApprove = (id: string, studentId: string) => {
    updateStatus.mutate({ id, status: "approved", student_id: studentId });
  };

  const handleReject = (id: string, studentId: string) => {
    updateStatus.mutate({ id, status: "rejected", student_id: studentId });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">
            {role === "trainer" ? "DASHBOARD" : "MEU PAINEL"}
          </p>
          <h1 className="font-display font-light text-2xl md:text-4xl tracking-tight">
            Olá, {profile?.full_name?.split(" ")[0] || "Usuário"}
          </h1>
          <p className="font-body font-light text-muted-foreground mt-1 text-sm">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </motion.div>

        {/* Stats */}
        {role === "trainer" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 1}
                className="bg-background p-4 md:p-6"
              >
                <stat.icon className="h-4 w-4 text-muted-foreground mb-3" strokeWidth={1.5} />
                <p className="font-display font-light text-2xl md:text-3xl mb-1">{stat.value}</p>
                <p className="text-editorial-sm text-muted-foreground text-[9px] md:text-[10px]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="lg:col-span-1 card-editorial">
            <div className="flex items-center justify-between mb-4">
              <p className="text-editorial-sm">AGENDA DE HOJE</p>
              <Link to="/schedule" className="text-editorial-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[9px]">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body font-light py-8 text-center">
                Nenhuma sessão hoje
              </p>
            ) : (
              <div className="space-y-0">
                {todaySessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 py-3 border-t border-border">
                    <span className="font-display text-xs w-12 shrink-0 text-muted-foreground">
                      {session.start_time?.slice(0, 5)}
                    </span>
                    <span className="font-body text-sm font-light flex-1 truncate">
                      {(session.student as any)?.full_name || (session.trainer as any)?.full_name || "—"}
                    </span>
                    <span className={`status-badge ${
                      session.status === "approved" ? "status-approved" :
                      session.status === "pending" ? "status-pending" :
                      session.status === "completed" ? "status-approved" : "status-rejected"
                    }`}>
                      {session.status === "approved" ? "Confirmado" :
                       session.status === "pending" ? "Pendente" :
                       session.status === "completed" ? "Concluído" : session.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pending Requests (trainer only) */}
          {role === "trainer" && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="lg:col-span-1 card-editorial">
              <div className="flex items-center justify-between mb-4">
                <p className="text-editorial-sm">PENDENTES</p>
                {pendingSessions.length > 0 && (
                  <span className="text-editorial-sm text-warning">{pendingSessions.length}</span>
                )}
              </div>
              {pendingSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground font-body font-light py-8 text-center">
                  Nenhuma solicitação pendente
                </p>
              ) : (
                <div className="space-y-0">
                  {pendingSessions.slice(0, 5).map((req) => (
                    <div key={req.id} className="py-3 border-t border-border">
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0">
                          <p className="font-body text-sm truncate">{(req.student as any)?.full_name}</p>
                          <p className="text-[11px] text-muted-foreground font-body font-light">
                            {format(parseISO(req.date), "EEE, dd/MM", { locale: ptBR })} · {req.start_time?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApprove(req.id, req.student_id)}
                          className="flex-1 py-1.5 text-editorial-sm border border-success text-success hover:bg-success hover:text-success-foreground transition-colors duration-300 text-[9px]"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.student_id)}
                          className="flex-1 py-1.5 text-editorial-sm border border-border text-muted-foreground hover:border-risk hover:text-risk transition-colors duration-300 text-[9px]"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Alerts */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} className="lg:col-span-1 card-editorial">
            <div className="flex items-center justify-between mb-4">
              <p className="text-editorial-sm">ALERTAS</p>
              <Link to="/notifications" className="text-editorial-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[9px]">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body font-light py-8 text-center">
                Nenhum alerta recente
              </p>
            ) : (
              <div className="space-y-0">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 py-3 border-t border-border">
                    {alert.type === "retention" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
                    ) : alert.type === "achievement" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
                    ) : (
                      <Calendar className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                    )}
                    <div className="min-w-0">
                      <p className="font-body text-sm truncate">{alert.title}</p>
                      <p className="text-[11px] font-body font-light text-muted-foreground truncate">{alert.message}</p>
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
