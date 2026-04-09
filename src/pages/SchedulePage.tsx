import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Loader2, MessageCircle, RotateCcw, Users } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useCreateSession, useUpdateSessionStatus, useMakeupSessions } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import { format, addDays, startOfWeek, parseISO, isBefore, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const sessionTypes = ["Musculação", "Funcional", "Pilates", "Cardio"];

const SchedulePage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [sessionType, setSessionType] = useState("Musculação");
  const [notes, setNotes] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMakeupId, setSelectedMakeupId] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 0 : new Date().getDay() - 1);

  const { user, role, profile } = useAuth();
  const { data: sessions } = useSessions();
  const { data: students } = useStudents();
  const { data: makeupSessions } = useMakeupSessions();
  const createSession = useCreateSession();
  const updateStatus = useUpdateSessionStatus();

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const getSession = (date: Date, hour: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return sessions?.find(
      (s) => s.date === dateStr && s.start_time?.slice(0, 5) === hour
    );
  };

  // Only trainers can click on slots to create sessions
  const handleSlotClick = (date: Date, hour: string) => {
    if (role !== "trainer") return;
    const existing = getSession(date, hour);
    if (existing) return;
    if (isBefore(new Date(`${format(date, "yyyy-MM-dd")}T${hour}`), new Date())) return;
    setSelectedSlot({ date: format(date, "yyyy-MM-dd"), time: hour });
    setSelectedStudentId("");
    setSelectedMakeupId(null);
    setShowModal(true);
  };

  const handleCreateSession = async () => {
    if (!selectedSlot || !user || role !== "trainer") return;
    if (!selectedStudentId) {
      return;
    }
    const endHour = String(Number(selectedSlot.time.split(":")[0]) + 1).padStart(2, "0") + ":00";
    try {
      await createSession.mutateAsync({
        student_id: selectedStudentId,
        trainer_id: user.id,
        date: selectedSlot.date,
        start_time: selectedSlot.time,
        end_time: endHour,
        session_type: sessionType,
        notes: notes || undefined,
        original_session_id: selectedMakeupId || undefined,
      });
      setShowModal(false);
      setNotes("");
      setSelectedStudentId("");
      setSelectedMakeupId(null);
    } catch {
      // error handled by hook
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "approved": return "Aprovado";
      case "completed": return "Feito";
      case "rejected": return "Recusado";
      case "cancelled": return "Cancelado";
      case "missed": return "Falta";
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-warning";
      case "approved": return "text-success";
      case "completed": return "text-primary";
      default: return "text-risk";
    }
  };

  const renderSlot = (day: Date, hour: string) => {
    const session = getSession(day, hour);
    const isPast = isBefore(new Date(`${format(day, "yyyy-MM-dd")}T${hour}`), new Date());

    // Students see other people's sessions as occupied
    if (role === "student" && session && session.student_id !== user?.id) {
      return (
        <div className="bg-muted/30 p-2 min-h-[56px] rounded-xl border border-border">
          <p className="text-[10px] text-muted-foreground font-body text-center leading-[40px]">Ocupado</p>
        </div>
      );
    }

    return (
      <div
        onClick={() => !session && !isPast && handleSlotClick(day, hour)}
        className={`p-2.5 min-h-[56px] rounded-xl transition-all duration-200 ${
          session
            ? session.status === "pending"
              ? "bg-warning/10 border border-warning/30"
              : session.status === "approved"
              ? "bg-success/10 border border-success/30"
              : session.status === "completed"
              ? "bg-primary/10 border border-primary/30"
              : "bg-risk/10 border border-risk/30"
            : isPast
            ? "bg-muted/20 border border-transparent opacity-40"
            : role === "trainer"
            ? "border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:bg-primary/10"
            : "border border-dashed border-border/50 opacity-60"
        }`}
      >
        {session ? (
          <div>
            <p className="text-[11px] font-body truncate font-medium">
              {role === "trainer"
                ? (session.student as any)?.full_name || "—"
                : (session.trainer as any)?.full_name || "—"}
            </p>
            <span className={`text-[9px] font-display uppercase tracking-wider font-semibold ${statusColor(session.status)}`}>
              {statusLabel(session.status)}
            </span>
            {session.session_type && (
              <p className="text-[9px] text-muted-foreground mt-0.5">{session.session_type}</p>
            )}
            {/* Makeup deadline indicator */}
            {session.status === "missed" && (session as any).makeup_deadline && (
              <p className="text-[9px] text-warning mt-0.5 flex items-center gap-0.5">
                <RotateCcw className="h-2.5 w-2.5" />
                Repor até {format(parseISO((session as any).makeup_deadline), "dd/MM")}
              </p>
            )}
            {/* Trainer actions */}
            {role === "trainer" && session.status === "pending" && (
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "approved", student_id: session.student_id }); }}
                  className="text-[9px] text-success bg-success/10 border border-success/30 px-2 py-1 rounded-lg hover:bg-success hover:text-success-foreground transition-colors min-h-[28px] min-w-[28px] font-medium"
                >✓</button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "rejected", student_id: session.student_id }); }}
                  className="text-[9px] text-risk bg-risk/10 border border-risk/30 px-2 py-1 rounded-lg hover:bg-risk hover:text-risk-foreground transition-colors min-h-[28px] min-w-[28px] font-medium"
                >✗</button>
              </div>
            )}
            {role === "trainer" && session.status === "approved" && isPast && (
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "completed", student_id: session.student_id }); }}
                  className="text-[9px] text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors min-h-[28px] font-medium"
                >✓ Feito</button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "missed", student_id: session.student_id }); }}
                  className="text-[9px] text-warning bg-warning/10 border border-warning/30 px-2 py-1 rounded-lg hover:bg-warning hover:text-warning-foreground transition-colors min-h-[28px] font-medium"
                >Falta</button>
              </div>
            )}
          </div>
        ) : isPast ? null : (
          role === "trainer" ? (
            <p className="text-[10px] text-primary/40 font-body text-center leading-[40px]">+</p>
          ) : null
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-1">AGENDA</p>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              {role === "trainer" ? "Sua semana" : "Meus treinos"}
            </h1>
            {role === "student" && !profile?.trainer_id && (
              <p className="text-sm text-risk font-body mt-2 bg-risk/10 px-3 py-2 rounded-xl border border-risk/20">
                ⚠️ Vincule-se a um personal primeiro em Configurações.
              </p>
            )}
          </div>
        </motion.div>

        {/* Student: info banner about messaging trainer */}
        {role === "student" && profile?.trainer_id && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5}>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">A agenda é controlada pelo seu personal</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Para agendar, remarcar ou cancelar treinos, envie uma mensagem.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/messages")} className="shrink-0 rounded-xl">
                Mensagem
              </Button>
            </div>
          </motion.div>
        )}

        {/* Student: makeup sessions available */}
        {role === "student" && makeupSessions && makeupSessions.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.7}>
            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-warning">Reposições disponíveis</p>
              </div>
              <div className="space-y-2">
                {makeupSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-background/60 rounded-xl px-3 py-2 border border-border/50">
                    <div>
                      <p className="text-xs font-medium">
                        {s.session_type || "Treino"} — {format(parseISO(s.date), "dd/MM")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Repor até {format(parseISO((s as any).makeup_deadline), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/messages")} className="text-xs rounded-xl h-8">
                      Pedir reposição
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Week nav */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 hover:bg-accent rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <p className="font-display font-medium text-sm">
            {format(weekStart, "dd/MM")} — {format(addDays(weekStart, 5), "dd/MM/yyyy")}
          </p>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-accent rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-primary font-medium">Hoje</Button>
          )}
        </motion.div>

        {/* Mobile: day selector + day view */}
        {isMobile ? (
          <>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4">
              {weekDays.map((day, i) => {
                const daySessionCount = sessions?.filter(s => s.date === format(day, "yyyy-MM-dd")).length || 0;
                const today = isToday(day);
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDayIndex(i)}
                    className={`flex flex-col items-center py-2.5 px-3 rounded-2xl min-w-[56px] min-h-[72px] transition-all relative ${
                      selectedDayIndex === i
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : today
                        ? "bg-primary/10 border-2 border-primary text-foreground"
                        : "bg-card border border-border text-foreground hover:border-primary/30"
                    }`}>
                    <span className="text-[10px] font-display uppercase font-semibold tracking-wide">{format(day, "EEE", { locale: ptBR })}</span>
                    <span className="font-display text-xl font-bold mt-0.5">{format(day, "dd")}</span>
                    {daySessionCount > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: Math.min(daySessionCount, 3) }).map((_, idx) => (
                          <span key={idx} className={`w-1.5 h-1.5 rounded-full ${selectedDayIndex === i ? "bg-primary-foreground/70" : "bg-primary"}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-1">
              {hours.map((hour) => {
                const day = weekDays[selectedDayIndex];
                const session = getSession(day, hour);
                return (
                  <div key={hour} className="flex gap-0">
                    <div className="w-16 py-3 flex items-start justify-end pr-3 shrink-0 border-r border-border/50">
                      <span className="font-display text-xs text-muted-foreground font-medium">{hour}</span>
                    </div>
                    <div className="flex-1 pl-3">{renderSlot(day, hour)}</div>
                  </div>
                );
              })}
            </motion.div>
          </>
        ) : (
          /* Desktop: Teams-style week grid */
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-border">
                <div className="border-r border-border" />
                {weekDays.map((day) => {
                  const today = isToday(day);
                  const daySessionCount = sessions?.filter(s => s.date === format(day, "yyyy-MM-dd")).length || 0;
                  return (
                    <div key={day.toISOString()} className={`py-3 text-center border-r border-border last:border-r-0 ${today ? "bg-primary/5" : ""}`}>
                      <p className={`text-[10px] font-display uppercase tracking-widest font-semibold ${today ? "text-primary" : "text-muted-foreground"}`}>
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <div className="flex items-center justify-center mt-1">
                        <span className={`font-display text-lg font-bold inline-flex items-center justify-center ${
                          today
                            ? "bg-primary text-primary-foreground w-8 h-8 rounded-full"
                            : "text-foreground"
                        }`}>
                          {format(day, "dd")}
                        </span>
                      </div>
                      {daySessionCount > 0 && (
                        <div className="flex gap-0.5 justify-center mt-1.5">
                          {Array.from({ length: Math.min(daySessionCount, 4) }).map((_, idx) => (
                            <span key={idx} className={`w-1.5 h-1.5 rounded-full ${today ? "bg-primary" : "bg-muted-foreground/40"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Time rows */}
              {hours.map((hour, hourIdx) => (
                <div key={hour} className={`grid grid-cols-[60px_repeat(6,1fr)] ${hourIdx < hours.length - 1 ? "border-b border-border/50" : ""}`}>
                  <div className="py-2 px-2 flex items-start justify-end pr-3 border-r border-border">
                    <span className="font-display text-[11px] text-muted-foreground font-medium mt-1">{hour}</span>
                  </div>
                  {weekDays.map((day) => {
                    const today = isToday(day);
                    return (
                      <div key={day.toISOString() + hour} className={`p-0.5 border-r border-border/30 last:border-r-0 ${today ? "bg-primary/[0.02]" : ""}`}>
                        {renderSlot(day, hour)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] bg-card border border-border rounded-2xl p-3 px-4">
          {[
            { label: "Aprovado", dot: "bg-success" },
            { label: "Pendente", dot: "bg-warning" },
            { label: "Concluído", dot: "bg-primary" },
            { label: "Falta / Reposição", dot: "bg-risk" },
            ...(role === "trainer" ? [{ label: "Disponível", dot: "bg-muted-foreground" }] : []),
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
              <span className="font-body text-muted-foreground font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer: Create Session Modal */}
      {showModal && selectedSlot && role === "trainer" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-border p-6 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl safe-bottom shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-editorial-sm text-primary text-xs">AGENDAR SESSÃO</p>
              <button onClick={() => setShowModal(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <label className="text-[10px] font-display text-primary uppercase tracking-wider font-medium">Data e horário</label>
                <p className="font-display font-semibold text-sm mt-0.5">
                  {format(parseISO(selectedSlot.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })} às {selectedSlot.time}
                </p>
              </div>

              {/* Student selector */}
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Aluno
                </label>
                {students && students.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto">
                    {students.map((s) => (
                      <button
                        key={s.user_id}
                        onClick={() => setSelectedStudentId(s.user_id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                          selectedStudentId === s.user_id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-foreground hover:bg-accent"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {s.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="truncate font-medium text-xs">{s.full_name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl">Nenhum aluno vinculado.</p>
                )}
              </div>

              {/* Makeup session selector (if student has pending makeups) */}
              {selectedStudentId && (() => {
                const studentMakeups = sessions?.filter(
                  s => s.student_id === selectedStudentId && s.status === "missed" && (s as any).makeup_deadline && new Date((s as any).makeup_deadline) >= new Date()
                );
                if (!studentMakeups || studentMakeups.length === 0) return null;
                return (
                  <div>
                    <label className="text-xs font-body font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Reposição de falta (opcional)
                    </label>
                    <div className="space-y-1.5">
                      {studentMakeups.map((ms) => (
                        <button
                          key={ms.id}
                          onClick={() => setSelectedMakeupId(selectedMakeupId === ms.id ? null : ms.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all ${
                            selectedMakeupId === ms.id
                              ? "bg-warning/15 border border-warning/30 text-warning"
                              : "bg-muted/30 border border-border hover:bg-accent"
                          }`}
                        >
                          <span>{ms.session_type || "Treino"} — Falta em {format(parseISO(ms.date), "dd/MM")}</span>
                          <span className="text-[10px] text-muted-foreground">até {format(parseISO((ms as any).makeup_deadline), "dd/MM")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-2 block">Tipo de treino</label>
                <div className="grid grid-cols-2 gap-2">
                  {sessionTypes.map((t) => (
                    <button key={t} onClick={() => setSessionType(t)}
                      className={`py-3 text-xs font-display font-medium rounded-xl transition-all min-h-[44px] ${
                        sessionType === t
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Observação (opcional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma observação..." className="font-body h-12 rounded-xl" />
              </div>
              <Button onClick={handleCreateSession} disabled={createSession.isPending || !selectedStudentId}
                className="w-full h-12 text-base rounded-xl">
                {createSession.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</>
                ) : (
                  selectedMakeupId ? "Agendar reposição" : "Agendar sessão"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
};

export default SchedulePage;
