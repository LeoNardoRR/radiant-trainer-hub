import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useCreateSession, useUpdateSessionStatus } from "@/hooks/useSessions";
import { format, addDays, startOfWeek, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const SchedulePage = () => {
  const isMobile = useIsMobile();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [sessionType, setSessionType] = useState("Musculação");
  const [notes, setNotes] = useState("");
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 0 : new Date().getDay() - 1);

  const { user, role, profile } = useAuth();
  const { data: sessions } = useSessions();
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

  const handleSlotClick = (date: Date, hour: string) => {
    const existing = getSession(date, hour);
    if (existing) return;
    if (isBefore(new Date(`${format(date, "yyyy-MM-dd")}T${hour}`), new Date())) return;
    setSelectedSlot({ date: format(date, "yyyy-MM-dd"), time: hour });
    setShowModal(true);
  };

  const handleCreateSession = async () => {
    if (!selectedSlot || !user) return;
    const endHour = String(Number(selectedSlot.time.split(":")[0]) + 1).padStart(2, "0") + ":00";
    const trainerId = role === "trainer" ? user.id : profile?.trainer_id;
    if (!trainerId) return;
    try {
      await createSession.mutateAsync({
        trainer_id: trainerId,
        date: selectedSlot.date,
        start_time: selectedSlot.time,
        end_time: endHour,
        session_type: sessionType,
        notes: notes || undefined,
      });
      setShowModal(false);
      setNotes("");
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

    if (role === "student" && session && session.student_id !== user?.id) {
      return (
        <div className="bg-muted/30 p-2 min-h-[56px] rounded-xl border border-border">
          <p className="text-[10px] text-muted-foreground font-body text-center leading-[40px]">—</p>
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
            : "border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer active:bg-primary/10"
        }`}
      >
        {session ? (
          <div>
            <p className="text-[11px] font-body truncate font-medium">
              {session.student?.full_name || session.trainer?.full_name || "—"}
            </p>
            <span className={`text-[9px] font-display uppercase tracking-wider font-semibold ${statusColor(session.status)}`}>
              {statusLabel(session.status)}
            </span>
            {session.session_type && (
              <p className="text-[9px] text-muted-foreground mt-0.5">{session.session_type}</p>
            )}
            {role === "trainer" && session.status === "pending" && (
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "approved", student_id: session.student_id }); }}
                  className="text-[9px] text-success bg-success/10 border border-success/30 px-2 py-1 rounded-lg hover:bg-success hover:text-success-foreground transition-colors min-h-[28px] min-w-[28px] font-medium"
                >
                  ✓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "rejected", student_id: session.student_id }); }}
                  className="text-[9px] text-risk bg-risk/10 border border-risk/30 px-2 py-1 rounded-lg hover:bg-risk hover:text-risk-foreground transition-colors min-h-[28px] min-w-[28px] font-medium"
                >
                  ✗
                </button>
              </div>
            )}
            {role === "trainer" && session.status === "approved" && isPast && (
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "completed", student_id: session.student_id }); }}
                  className="text-[9px] text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors min-h-[28px] font-medium"
                >
                  ✓ Feito
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "missed", student_id: session.student_id }); }}
                  className="text-[9px] text-warning bg-warning/10 border border-warning/30 px-2 py-1 rounded-lg hover:bg-warning hover:text-warning-foreground transition-colors min-h-[28px] font-medium"
                >
                  Falta
                </button>
              </div>
            )}
            {role === "student" && session.status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "cancelled", student_id: session.student_id }); }}
                className="text-[9px] text-risk bg-risk/10 border border-risk/30 px-2 py-1 mt-1.5 rounded-lg hover:bg-risk hover:text-risk-foreground transition-colors min-h-[28px] font-medium"
              >
                Cancelar
              </button>
            )}
          </div>
        ) : isPast ? null : (
          <p className="text-[10px] text-primary/40 font-body text-center leading-[40px]">+</p>
        )}
      </div>
    );
  };

  const sessionTypes = ["Musculação", "Funcional", "Pilates", "Cardio"];

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-1">AGENDA</p>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
              {role === "student" ? "Agendar treino" : "Sua semana"}
            </h1>
            {role === "student" && !profile?.trainer_id && (
              <p className="text-sm text-risk font-body mt-2 bg-risk/10 px-3 py-2 rounded-xl border border-risk/20">
                ⚠️ Vincule-se a um personal primeiro em Configurações.
              </p>
            )}
          </div>
        </motion.div>

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
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {weekDays.map((day, i) => {
                const daySessionCount = sessions?.filter(s => s.date === format(day, "yyyy-MM-dd")).length || 0;
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDayIndex(i)}
                    className={`flex flex-col items-center py-2 px-3 rounded-2xl min-w-[52px] min-h-[64px] transition-all relative ${
                      selectedDayIndex === i
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-card border border-border text-foreground hover:border-primary/30"
                    }`}>
                    <span className="text-[9px] font-display uppercase font-medium">{format(day, "EEE", { locale: ptBR })}</span>
                    <span className="font-display text-lg font-bold">{format(day, "dd")}</span>
                    {daySessionCount > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selectedDayIndex === i ? "bg-primary-foreground/60" : "bg-primary"}`} />
                    )}
                  </button>
                );
              })}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-1.5">
              {hours.map((hour) => {
                const day = weekDays[selectedDayIndex];
                return (
                  <div key={hour} className="flex gap-2">
                    <div className="w-14 py-3 flex items-start justify-end pr-2 shrink-0">
                      <span className="font-display text-xs text-muted-foreground font-medium">{hour}</span>
                    </div>
                    <div className="flex-1">{renderSlot(day, hour)}</div>
                  </div>
                );
              })}
            </motion.div>
          </>
        ) : (
          /* Desktop: week grid */
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[50px_repeat(6,1fr)] gap-1 mb-1">
                  <div />
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="py-2 text-center">
                      <p className="text-[9px] font-display uppercase text-muted-foreground font-medium">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className="font-display text-sm font-bold">{format(day, "dd")}</p>
                    </div>
                  ))}
                </div>
                {hours.map((hour) => (
                  <div key={hour} className="grid grid-cols-[50px_repeat(6,1fr)] gap-1 mb-1">
                    <div className="py-2 px-1 flex items-center">
                      <span className="font-display text-[10px] text-muted-foreground font-medium">{hour}</span>
                    </div>
                    {weekDays.map((day) => (
                      <div key={day.toISOString() + hour}>
                        {renderSlot(day, hour)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] bg-card border border-border rounded-2xl p-3 px-4">
          {[
            { label: "Aprovado", dot: "bg-success" },
            { label: "Pendente", dot: "bg-warning" },
            { label: "Concluído", dot: "bg-primary" },
            { label: "Disponível", dot: "bg-muted-foreground" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
              <span className="font-body text-muted-foreground font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowModal(false)} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-border p-6 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl safe-bottom shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p id="modal-title" className="text-editorial-sm text-primary text-xs">NOVO AGENDAMENTO</p>
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
              <Button onClick={handleCreateSession} disabled={createSession.isPending || (role === "student" && !profile?.trainer_id)}
                className="w-full h-12 text-base rounded-xl">
                {createSession.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                ) : (
                  "Solicitar agendamento"
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
