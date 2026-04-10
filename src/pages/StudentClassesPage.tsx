import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MessageCircle, RotateCcw, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useMakeupSessions } from "@/hooks/useSessions";
import { format, parseISO, isPast, isToday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

type TabKey = "upcoming" | "history" | "makeup";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pendente", color: "text-warning", bg: "bg-warning/10 border-warning/20", icon: Clock },
  approved: { label: "Confirmado", color: "text-success", bg: "bg-success/10 border-success/20", icon: CheckCircle2 },
  completed: { label: "Concluído", color: "text-primary", bg: "bg-primary/10 border-primary/20", icon: CheckCircle2 },
  missed: { label: "Falta", color: "text-risk", bg: "bg-risk/10 border-risk/20", icon: XCircle },
  cancelled: { label: "Cancelado", color: "text-muted-foreground", bg: "bg-muted border-border", icon: XCircle },
  rejected: { label: "Recusado", color: "text-risk", bg: "bg-risk/10 border-risk/20", icon: XCircle },
};

const StudentClassesPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: sessions } = useSessions();
  const { data: makeupSessions } = useMakeupSessions();

  const upcomingSessions = sessions?.filter(
    (s) => (s.status === "approved" || s.status === "pending") && !isPast(new Date(`${s.date}T${s.end_time}`))
  ).sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)) || [];

  const historySessions = sessions?.filter(
    (s) => s.status === "completed" || s.status === "missed" || s.status === "cancelled" || s.status === "rejected" || isPast(new Date(`${s.date}T${s.end_time}`))
  ).sort((a, b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`)) || [];

  const makeupList = makeupSessions || [];

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming", label: "Próximas", count: upcomingSessions.length },
    { key: "history", label: "Histórico", count: historySessions.length },
    { key: "makeup", label: "Reposições", count: makeupList.length },
  ];

  const renderSessionCard = (session: any, showDate = true) => {
    const config = statusConfig[session.status] || statusConfig.pending;
    const StatusIcon = config.icon;
    const sessionDate = parseISO(session.date);
    const today = isToday(sessionDate);

    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-4 transition-all ${config.bg}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {showDate && (
              <p className={`text-xs font-semibold mb-1 ${today ? "text-primary" : "text-muted-foreground"}`}>
                {today ? "HOJE" : format(sessionDate, "EEEE, dd 'de' MMM", { locale: ptBR }).toUpperCase()}
              </p>
            )}
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-bold">
                {session.start_time?.slice(0, 5)} — {session.end_time?.slice(0, 5)}
              </span>
            </div>
            {session.session_type && (
              <span className="inline-block text-[11px] font-semibold bg-background/80 border border-border px-2.5 py-1 rounded-lg mb-2">
                {session.session_type}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              Personal: {(session.trainer as any)?.full_name || "—"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1.5 ${config.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="text-xs font-bold">{config.label}</span>
            </div>
            {session.status === "missed" && (session as any).makeup_deadline && (
              <div className="flex items-center gap-1 text-warning">
                <RotateCcw className="h-3 w-3" />
                <span className="text-[10px] font-semibold">
                  Repor até {format(parseISO((session as any).makeup_deadline), "dd/MM")}
                </span>
              </div>
            )}
          </div>
        </div>
        {session.notes && (
          <p className="text-xs text-muted-foreground mt-2 bg-background/60 p-2 rounded-lg">
            📝 {session.notes}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">MINHAS AULAS</p>
          <h1 className="font-bold text-2xl tracking-tight">Meus treinos</h1>
        </motion.div>

        {/* Info banner */}
        {profile?.trainer_id && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5}>
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Precisa remarcar?</p>
                <p className="text-xs text-muted-foreground">Envie uma mensagem ao seu personal.</p>
              </div>
              <Button size="sm" onClick={() => navigate("/messages")} className="shrink-0 h-10 px-4 rounded-xl">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Chat
              </Button>
            </div>
          </motion.div>
        )}

        {!profile?.trainer_id && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5}>
            <div className="bg-risk/5 border border-risk/15 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-risk shrink-0" />
              <div>
                <p className="text-sm font-semibold text-risk">Sem personal vinculado</p>
                <p className="text-xs text-muted-foreground">Vá em Ajustes para inserir seu código de convite.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/settings")} className="shrink-0 h-10 rounded-xl">
                Ajustes
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`min-w-[20px] h-5 rounded-full text-[10px] flex items-center justify-center px-1 font-bold ${
                    activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "upcoming" && (
            <motion.div key="upcoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <EmptyState icon={Calendar} emoji="📅" title="Nenhuma aula agendada" description="Seu personal ainda não agendou aulas para você." />
              ) : (
                upcomingSessions.map((s) => renderSessionCard(s))
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {historySessions.length === 0 ? (
                <EmptyState icon={Clock} emoji="📋" title="Sem histórico" description="Suas aulas concluídas aparecerão aqui." />
              ) : (
                historySessions.slice(0, 20).map((s) => renderSessionCard(s))
              )}
            </motion.div>
          )}

          {activeTab === "makeup" && (
            <motion.div key="makeup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {makeupList.length === 0 ? (
                <EmptyState icon={RotateCcw} emoji="✅" title="Nenhuma reposição" description="Você não tem aulas para repor." />
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Fale com seu personal para remarcar as aulas abaixo.
                  </p>
                  {makeupList.map((s) => (
                    <div key={s.id} className="border border-warning/20 bg-warning/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold">{s.session_type || "Treino"}</p>
                          <p className="text-xs text-muted-foreground">
                            Falta em {format(parseISO(s.date), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-warning uppercase">Repor até</p>
                          <p className="text-sm font-bold text-warning">
                            {format(parseISO((s as any).makeup_deadline), "dd/MM")}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => navigate("/messages")} className="w-full h-10 rounded-xl mt-2">
                        <MessageCircle className="h-4 w-4 mr-1.5" />
                        Pedir reposição ao personal
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default StudentClassesPage;
