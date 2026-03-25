import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useCreateSession, useUpdateSessionStatus } from "@/hooks/useSessions";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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

  const { user, role } = useAuth();
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
    setSelectedSlot({ date: format(date, "yyyy-MM-dd"), time: hour });
    setShowModal(true);
  };

  const handleCreateSession = async () => {
    if (!selectedSlot || !user) return;
    const endHour = String(Number(selectedSlot.time.split(":")[0]) + 1).padStart(2, "0") + ":00";
    try {
      await createSession.mutateAsync({
        trainer_id: user.id, // For students, this should be their trainer's ID
        date: selectedSlot.date,
        start_time: selectedSlot.time,
        end_time: endHour,
        session_type: sessionType,
        notes: notes || undefined,
      });
      setShowModal(false);
      setNotes("");
    } catch (err) {
      // error handled by hook
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-2">AGENDA</p>
            <h1 className="font-display font-light text-2xl md:text-3xl tracking-tight">Sua semana</h1>
          </div>
        </motion.div>

        {/* Week nav */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex items-center gap-4">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 hover:bg-accent rounded transition-colors">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <p className="font-display text-sm">
            {format(weekStart, "dd/MM")} — {format(addDays(weekStart, 5), "dd/MM/yyyy")}
          </p>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-accent rounded transition-colors">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-editorial-sm text-muted-foreground hover:text-foreground">
              Hoje
            </button>
          )}
        </motion.div>

        {/* Grid */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[600px]">
            {/* Day headers */}
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

            {/* Time slots */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[50px_repeat(6,1fr)] gap-[1px] bg-border mb-[1px]">
                <div className="bg-background py-2 px-1 flex items-center">
                  <span className="font-display text-[10px] text-muted-foreground">{hour}</span>
                </div>
                {weekDays.map((day) => {
                  const session = getSession(day, hour);
                  return (
                    <div
                      key={day.toISOString() + hour}
                      onClick={() => !session && handleSlotClick(day, hour)}
                      className={`bg-background p-1.5 min-h-[48px] transition-all duration-300 ${
                        session
                          ? session.status === "pending"
                            ? "bg-warning/5 border border-warning/20"
                            : session.status === "approved"
                            ? "bg-foreground/5 border border-foreground/10"
                            : session.status === "completed"
                            ? "bg-success/5 border border-success/20"
                            : "bg-risk/5 border border-risk/20"
                          : "border border-dashed border-border hover:border-foreground/30 cursor-pointer"
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
                            <div className="flex gap-0.5 mt-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "approved", student_id: session.student_id }); }}
                                className="text-[7px] text-success border border-success/30 px-1 py-0.5 hover:bg-success hover:text-success-foreground transition-colors"
                              >
                                ✓
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "rejected", student_id: session.student_id }); }}
                                className="text-[7px] text-risk border border-risk/30 px-1 py-0.5 hover:bg-risk hover:text-risk-foreground transition-colors"
                              >
                                ✗
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/50 font-body text-center leading-[36px]">+</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px]">
          {[
            { label: "Aprovado", cls: "bg-foreground/5 border-foreground/10" },
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
            className="bg-background border border-border p-6 w-full sm:max-w-md sm:rounded-sm rounded-t-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-editorial-sm">NOVO AGENDAMENTO</p>
              <button onClick={() => setShowModal(false)}>
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-4">
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
                      className={`flex-1 py-2 text-editorial-sm text-[9px] transition-colors ${
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
                  className="font-body font-light h-10"
                />
              </div>
              <Button
                onClick={handleCreateSession}
                disabled={createSession.isPending}
                className="w-full text-editorial-sm h-11"
              >
                {createSession.isPending ? "Enviando..." : "Solicitar agendamento"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
};

export default SchedulePage;
