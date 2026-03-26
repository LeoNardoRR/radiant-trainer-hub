import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useCreateSession, useUpdateSessionStatus } from "@/hooks/useSessions";
import { format, addDays, startOfWeek, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const SchedulePage = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [sessionType, setSessionType] = useState("Musculação");
  const [notes, setNotes] = useState("");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

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

  const isSlotAvailable = (date: Date, hour: string) => {
    if (isBefore(date, startOfDay(new Date())) && format(date, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")) return false;
    const existing = getSession(date, hour);
    if (existing) {
      // Students: hide other students' sessions
      if (role === "student" && existing.student_id !== user?.id) return false;
    }
    return true;
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

  const renderSlot = (day: Date, hour: string) => {
    const session = getSession(day, hour);
    const isPast = isBefore(new Date(`${format(day, "yyyy-MM-dd")}T${hour}`), new Date());

    // Students shouldn't see other students' sessions
    if (role === "student" && session && session.student_id !== user?.id) {
      return (
        <div className="bg-muted/30 p-2 min-h-[56px] border border-border">
          <p className="text-[10px] text-muted-foreground font-body text-center leading-[40px]">—</p>
        </div>
      );
    }

    return (
      <div
        onClick={() => !session && !isPast && handleSlotClick(day, hour)}
        className={`p-2 min-h-[56px] transition-all duration-300 ${
          session
            ? session.status === "pending"
              ? "bg-warning/5 border border-warning/20"
              : session.status === "approved"
              ? "bg-success/5 border border-success/20"
              : session.status === "completed"
              ? "bg-success/5 border border-success/20"
              : "bg-risk/5 border border-risk/20"
            : isPast
            ? "bg-muted/20 border border-border opacity-50"
            : "border border-dashed border-border hover:border-foreground/30 cursor-pointer active:bg-accent/50"
        }`}
      >
        {session ? (
          <div>
            <p className="text-[10px] font-body truncate">
              {(session.student as any)?.full_name || (session.trainer as any)?.full_name || "—"}
            </p>
            <span className={`text-[8px] font-display uppercase tracking-wider ${
              session.status === "pending" ? "text-warning" :
              session.status === "approved" ? "text-success" :
              session.status === "completed" ? "text-success" : "text-risk"
            }`}>
              {session.status === "pending" ? "Pendente" :
               session.status === "approved" ? "Aprovado" :
               session.status === "completed" ? "Feito" : session.status}
            </span>
            {role === "trainer" && session.status === "pending" && (
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "approved", student_id: session.student_id }); }}
                  className="text-[9px] text-success border border-success/30 px-2 py-1 hover:bg-success hover:text-success-foreground transition-colors min-h-[28px] min-w-[28px]"
                >
                  ✓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "rejected", student_id: session.student_id }); }}
                  className="text-[9px] text-risk border border-risk/30 px-2 py-1 hover:bg-risk hover:text-risk-foreground transition-colors min-h-[28px] min-w-[28px]"
                >
                  ✗
                </button>
              </div>
            )}
            {role === "student" && session.status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "cancelled", student_id: session.student_id }); }}
                className="text-[9px] text-risk border border-risk/30 px-2 py-1 mt-1.5 hover:bg-risk hover:text-risk-foreground transition-colors min-h-[28px]"
              >
                Cancelar
              </button>
            )}
          </div>
        ) : isPast ? null : (
          <p className="text-[10px] text-muted-foreground/50 font-body text-center leading-[40px]">+</p>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-2">AGENDA</p>
            <h1 className="font-display font-light text-2xl md:text-3xl tracking-tight">
              {role === "student" ? "Agendar treino" : "Sua semana"}
            </h1>
            {role === "student" && !profile?.trainer_id && (
              <p className="text-sm text-risk font-body mt-2">
                Você precisa vincular-se a um personal primeiro. Vá em Configurações e use um código de convite.
              </p>
            )}
          </div>
          {/* Mobile view toggle */}
          <div className="flex gap-[1px] bg-border lg:hidden">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-2 text-editorial-sm text-[9px] transition-colors min-h-[44px] ${
                viewMode === "day" ? "bg-foreground text-primary-foreground" : "bg-background text-muted-foreground"
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-2 text-editorial-sm text-[9px] transition-colors min-h-[44px] ${
                viewMode === "week" ? "bg-foreground text-primary-foreground" : "bg-background text-muted-foreground"
              }`}
            >
              Semana
            </button>
          </div>
        </motion.div>

        {/* Week nav */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 hover:bg-accent rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <p className="font-display text-sm">
            {format(weekStart, "dd/MM")} — {format(addDays(weekStart, 5), "dd/MM/yyyy")}
          </p>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-accent rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-editorial-sm text-muted-foreground hover:text-foreground min-h-[44px] px-3 flex items-center">
              Hoje
            </button>
          )}
        </motion.div>

        {/* Mobile day selector */}
        {viewMode === "day" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="flex gap-1 overflow-x-auto pb-2 lg:hidden -mx-4 px-4">
            {weekDays.map((day, i) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDayIndex(i)}
                className={`flex flex-col items-center py-2 px-3 rounded-sm min-w-[52px] min-h-[56px] transition-colors ${
                  selectedDayIndex === i ? "bg-foreground text-primary-foreground" : "bg-accent/50 text-foreground"
                }`}
              >
                <span className="text-[9px] font-display uppercase">{format(day, "EEE", { locale: ptBR })}</span>
                <span className="font-display text-lg">{format(day, "dd")}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Grid - Desktop always week, Mobile respects viewMode */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {/* Desktop week view */}
          <div className={`${viewMode === "day" ? "hidden lg:block" : ""} overflow-x-auto -mx-4 px-4`}>
            <div className="min-w-[600px]">
              <div className="grid grid-cols-[50px_repeat(6,1fr)] gap-[1px] bg-border mb-[1px]">
                <div className="bg-background" />
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="bg-background py-2 text-center">
                    <p className="text-editorial-sm text-muted-foreground text-[9px]">
                      {format(day, "EEE", { locale: ptBR }).toUpperCase()}
                    </p>
                    <p className="font-display text-sm">{format(day, "dd")}</p>
                  </div>
                ))}
              </div>
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-[50px_repeat(6,1fr)] gap-[1px] bg-border mb-[1px]">
                  <div className="bg-background py-2 px-1 flex items-center">
                    <span className="font-display text-[10px] text-muted-foreground">{hour}</span>
                  </div>
                  {weekDays.map((day) => (
                    <div key={day.toISOString() + hour} className="bg-background">
                      {renderSlot(day, hour)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile day view */}
          {viewMode === "day" && (
            <div className="lg:hidden space-y-1">
              {hours.map((hour) => {
                const day = weekDays[selectedDayIndex];
                return (
                  <div key={hour} className="flex gap-2">
                    <div className="w-14 py-3 flex items-start justify-end pr-2 shrink-0">
                      <span className="font-display text-xs text-muted-foreground">{hour}</span>
                    </div>
                    <div className="flex-1">
                      {renderSlot(day, hour)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px]">
          {[
            { label: "Aprovado", cls: "bg-success/5 border-success/20" },
            { label: "Pendente", cls: "bg-warning/5 border-warning/20" },
            { label: "Disponível", cls: "border-dashed border-border" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 border ${item.cls}`} />
              <span className="font-body text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/10 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-border p-6 w-full sm:max-w-md sm:rounded-sm rounded-t-lg safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-editorial-sm">NOVO AGENDAMENTO</p>
              <button onClick={() => setShowModal(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1.5 block">Data e horário</label>
                <p className="font-display text-sm">
                  {format(parseISO(selectedSlot.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })} às {selectedSlot.time}
                </p>
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1.5 block">Tipo de treino</label>
                <div className="flex gap-[1px] bg-border">
                  {["Musculação", "Funcional", "Pilates"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSessionType(t)}
                      className={`flex-1 py-3 text-editorial-sm text-[9px] transition-colors min-h-[44px] ${
                        sessionType === t ? "bg-foreground text-primary-foreground" : "bg-background text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1.5 block">Observação (opcional)</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação..."
                  className="font-body font-light h-12"
                />
              </div>
              <Button
                onClick={handleCreateSession}
                disabled={createSession.isPending || (role === "student" && !profile?.trainer_id)}
                className="w-full text-editorial-sm h-12"
              >
                {createSession.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
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
