import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, X, Loader2, MessageCircle,
  RotateCcw, Users, Plus, CalendarRange, Clock, Check, Ban,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions, useCreateSession, useUpdateSessionStatus, useMakeupSessions } from "@/hooks/useSessions";
import { useStudents } from "@/hooks/useStudents";
import {
  format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth,
  endOfMonth, parseISO, isBefore, isToday, isSameDay, isSameMonth,
  getDaysInMonth, getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

/* ─── constants ─────────────────────────────────────────── */
const HOURS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00",
               "13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const SESSION_TYPES = ["Musculação", "Funcional", "Pilates", "Cardio", "Alongamento"];
type ViewMode = "day" | "week" | "month";

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

/* ─── status helpers ─────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", approved: "Confirmado", completed: "Concluído",
  rejected: "Recusado", cancelled: "Cancelado", missed: "Falta",
};
const STATUS_CLASSES: Record<string, string> = {
  pending:   "bg-warning/15 text-warning border-warning/25",
  approved:  "bg-success/15 text-success border-success/25",
  completed: "bg-primary/15 text-primary border-primary/25",
  rejected:  "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  missed:    "bg-destructive/10 text-destructive border-destructive/20",
};
const STATUS_DOT: Record<string, string> = {
  pending: "bg-warning", approved: "bg-success", completed: "bg-primary",
  rejected: "bg-destructive", cancelled: "bg-muted-foreground", missed: "bg-destructive",
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const SchedulePage = () => {
  const isMobile  = useIsMobile();
  const navigate  = useNavigate();

  const [viewMode, setViewMode]     = useState<ViewMode>("week");
  const [offset, setOffset]         = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* modal */
  const [showModal, setShowModal]   = useState(false);
  const [modalDate, setModalDate]   = useState<string>("");
  const [modalTime, setModalTime]   = useState<string>("08:00");
  const [sessionType, setSessionType] = useState("Musculação");
  const [notes, setNotes]           = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMakeupId, setSelectedMakeupId]   = useState<string | null>(null);

  const { user, role, profile } = useAuth();
  const { data: sessions }      = useSessions();
  const { data: students }      = useStudents();
  const { data: makeupSessions } = useMakeupSessions();
  const createSession = useCreateSession();
  const updateStatus  = useUpdateSessionStatus();

  /* ── reference dates ────────────────────────────────── */
  const today        = new Date();
  const weekStart    = startOfWeek(addWeeks(today, offset), { weekStartsOn: 1 });
  const weekDays     = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthRef     = addMonths(today, offset);
  const monthStart   = startOfMonth(monthRef);
  const padStart     = (getDay(monthStart) + 6) % 7;
  const monthGrid    = Array.from({ length: padStart + getDaysInMonth(monthRef) }, (_, i) =>
    i < padStart ? null : addDays(monthStart, i - padStart));

  /* ── helpers ─────────────────────────────────────────── */
  const sessionsForDay = (d: Date) =>
    (sessions ?? []).filter(s => s.date === format(d, "yyyy-MM-dd"));

  const openCreate = (date: Date, time = "08:00") => {
    if (role !== "trainer") return;
    setModalDate(format(date, "yyyy-MM-dd"));
    setModalTime(time);
    setSelectedStudentId(""); setSelectedMakeupId(null); setNotes("");
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!modalDate || !user || !selectedStudentId) return;
    const endH = String(Number(modalTime.split(":")[0]) + 1).padStart(2, "0") + ":00";
    try {
      await createSession.mutateAsync({
        student_id: selectedStudentId, trainer_id: user.id,
        date: modalDate, start_time: modalTime, end_time: endH,
        session_type: sessionType,
        notes: notes || undefined,
        original_session_id: selectedMakeupId || undefined,
      });
      setShowModal(false);
    } catch { /* hook handles */ }
  };

  /* ── nav ─────────────────────────────────────────────── */
  const navLabel = () => {
    if (viewMode === "day")   return format(addDays(today, offset), "EEEE, dd/MM", { locale: ptBR });
    if (viewMode === "week")  return `${format(weekStart, "dd/MM")} — ${format(addDays(weekStart, 6), "dd/MM/yyyy")}`;
    return format(monthRef, "MMMM yyyy", { locale: ptBR });
  };

  /* ─────────────────────────────────────────────────────────
     SESSION CARD  (used in day + week mobile views)
  ───────────────────────────────────────────────────────── */
  const SessionCard = ({ s }: { s: any }) => {
    const isPast = isBefore(parseISO(`${s.date}T${s.start_time}`), new Date());
    const cls    = STATUS_CLASSES[s.status] ?? STATUS_CLASSES.pending;
    const person = role === "trainer" ? s.student?.full_name : s.trainer?.full_name;
    return (
      <div className={`rounded-2xl border p-3.5 ${cls}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s.status]}`} />
              <p className="text-xs font-bold uppercase tracking-wide">{STATUS_LABEL[s.status]}</p>
            </div>
            <p className="font-bold text-sm truncate">{person ?? "—"}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] opacity-70">
              <Clock className="h-3 w-3" />
              <span>{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</span>
              {s.session_type && <span>· {s.session_type}</span>}
            </div>
            {s.status === "missed" && s.makeup_deadline && (
              <p className="text-[10px] mt-1 flex items-center gap-1 font-semibold">
                <RotateCcw className="h-2.5 w-2.5" />
                Repor até {format(parseISO(s.makeup_deadline), "dd/MM")}
              </p>
            )}
          </div>
          {/* Trainer actions */}
          {role === "trainer" && (
            <div className="flex flex-col gap-1.5 shrink-0">
              {s.status === "pending" && (
                <>
                  <button onClick={() => updateStatus.mutate({ id: s.id, status: "approved", student_id: s.student_id })}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-success/20 border border-success/30 text-success hover:bg-success hover:text-white transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => updateStatus.mutate({ id: s.id, status: "rejected", student_id: s.student_id })}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-colors">
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {s.status === "approved" && isPast && (
                <>
                  <button onClick={() => updateStatus.mutate({ id: s.id, status: "completed", student_id: s.student_id })}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 text-primary hover:bg-primary hover:text-white transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => updateStatus.mutate({ id: s.id, status: "missed", student_id: s.student_id })}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-warning/15 border border-warning/25 text-warning hover:bg-warning hover:text-white transition-colors">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────
     DAY COLUMN  (mobile: just the selected day; desktop: used in week grid)
  ───────────────────────────────────────────────────────── */
  const DayColumn = ({ day }: { day: Date }) => {
    const daySessions = sessionsForDay(day).sort((a, b) => a.start_time?.localeCompare(b.start_time));
    const canAdd      = role === "trainer" && !isBefore(day, new Date(new Date().setHours(0,0,0,0)));
    return (
      <div className="space-y-2 pb-4">
        {daySessions.length === 0 ? (
          canAdd ? (
            <button onClick={() => openCreate(day)}
              className="w-full py-8 rounded-2xl border-2 border-dashed border-primary/30 text-primary/50 text-sm font-bold flex flex-col items-center gap-1.5 hover:border-primary/60 hover:text-primary transition-colors bg-primary/5">
              <Plus className="h-5 w-5" />
              Agendar sessão
            </button>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">Nenhuma sessão</div>
          )
        ) : (
          <>
            {daySessions.map((s: any) => <SessionCard key={s.id} s={s} />)}
            {canAdd && (
              <button onClick={() => openCreate(day)}
                className="w-full py-3 rounded-xl border border-dashed border-primary/20 text-primary/40 text-xs font-bold hover:border-primary/40 hover:text-primary/70 transition-colors flex items-center justify-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────
     MOBILE WEEK / DAY STRIP
  ───────────────────────────────────────────────────────── */
  const DayStrip = ({ days }: { days: Date[] }) => (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {days.map(day => {
        const count  = sessionsForDay(day).length;
        const isTd   = isToday(day);
        const isSel  = isSameDay(day, selectedDate);
        return (
          <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
            className={`flex flex-col items-center py-2.5 px-3 rounded-2xl min-w-[52px] min-h-[68px] shrink-0 transition-all ${
              isSel  ? "bg-primary text-white shadow-lg shadow-primary/30"
              : isTd ? "bg-primary/10 border-2 border-primary text-foreground"
              : "bg-card border border-border text-foreground"
            }`}>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {format(day, "EEE", { locale: ptBR })}
            </span>
            <span className="text-xl font-black mt-0.5">{format(day, "dd")}</span>
            {count > 0 && (
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white/70" : "bg-primary"}`} />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     DESKTOP WEEK GRID
  ───────────────────────────────────────────────────────── */
  const DesktopWeekGrid = () => (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map(day => {
          const isTd  = isToday(day);
          const count = sessionsForDay(day).length;
          return (
            <div key={day.toISOString()} className={`py-3 text-center border-r border-border last:border-r-0 ${isTd ? "bg-primary/5" : ""}`}>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${isTd ? "text-primary" : "text-muted-foreground"}`}>
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <div className="flex items-center justify-center mt-1">
                <span className={`text-lg font-black inline-flex items-center justify-center w-8 h-8 rounded-full ${isTd ? "bg-primary text-white" : ""}`}>
                  {format(day, "dd")}
                </span>
              </div>
              {count > 0 && (
                <div className="flex gap-0.5 justify-center mt-1">
                  {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${isTd ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Time rows */}
      {HOURS.map((hour, hi) => (
        <div key={hour} className={`grid grid-cols-7 ${hi < HOURS.length - 1 ? "border-b border-border/30" : ""}`}>
          {weekDays.map(day => {
            const session = (sessions ?? []).find(
              s => s.date === format(day, "yyyy-MM-dd") && s.start_time?.slice(0, 5) === hour);
            const isPast  = isBefore(new Date(`${format(day, "yyyy-MM-dd")}T${hour}`), new Date());
            const cls     = session ? `${STATUS_CLASSES[session.status]} border` : "";
            return (
              <div key={day.toISOString() + hour}
                onClick={() => !session && !isPast && openCreate(day, hour)}
                className={`p-1 border-r border-border/20 last:border-r-0 min-h-[52px] ${isToday(day) ? "bg-primary/[0.02]" : ""} ${
                  !session && !isPast && role === "trainer" ? "cursor-pointer hover:bg-primary/5" : ""}`}>
                {session ? (
                  <div className={`rounded-lg p-1.5 h-full ${cls}`}>
                    <p className="text-[10px] font-bold truncate">
                      {role === "trainer" ? (session.student as any)?.full_name : (session.trainer as any)?.full_name}
                    </p>
                    <span className={`text-[8px] font-bold uppercase`}>{STATUS_LABEL[session.status]}</span>
                    {role === "trainer" && session.status === "pending" && (
                      <div className="flex gap-0.5 mt-1">
                        <button onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "approved", student_id: session.student_id }); }}
                          className="text-[8px] bg-success/20 text-success px-1.5 py-0.5 rounded-md border border-success/30 font-bold">✓</button>
                        <button onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "rejected", student_id: session.student_id }); }}
                          className="text-[8px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-md border border-destructive/20 font-bold">✗</button>
                      </div>
                    )}
                    {role === "trainer" && session.status === "approved" && isPast && (
                      <div className="flex gap-0.5 mt-1">
                        <button onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "completed", student_id: session.student_id }); }}
                          className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md border border-primary/25 font-bold">✓</button>
                        <button onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: session.id, status: "missed", student_id: session.student_id }); }}
                          className="text-[8px] bg-warning/15 text-warning px-1.5 py-0.5 rounded-md border border-warning/25 font-bold">F</button>
                      </div>
                    )}
                  </div>
                ) : !isPast && role === "trainer" ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-primary/20 text-lg font-black">+</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  /* ─────────────────────────────────────────────────────────
     MONTH GRID
  ───────────────────────────────────────────────────────── */
  const MonthGrid = () => (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d => (
          <div key={d} className="py-2 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{d}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid.map((day, i) => {
          if (!day) return <div key={`p${i}`} className="min-h-[60px] border-r border-b border-border/20 bg-muted/5 last:border-r-0" />;
          const isTd  = isToday(day);
          const inM   = isSameMonth(day, monthRef);
          const daySn = sessionsForDay(day);
          const isLR  = i >= monthGrid.length - 7;
          const isLC  = (i + 1) % 7 === 0;
          return (
            <div key={day.toISOString()}
              onClick={() => { setSelectedDate(day); setViewMode("day"); setOffset(Math.round((day.getTime() - today.getTime()) / 86400000)); }}
              className={`min-h-[60px] p-1 border-r border-b border-border/20 cursor-pointer hover:bg-muted/30 transition-colors
                ${isLR ? "border-b-0" : ""} ${isLC ? "border-r-0" : ""} ${!inM ? "opacity-25" : ""} ${isTd ? "bg-primary/5" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 text-xs font-black ${isTd ? "bg-primary text-white" : ""}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {daySn.slice(0, isMobile ? 1 : 2).map((s: any) => (
                  <div key={s.id} className={`rounded px-1 py-0.5 text-[8px] font-bold truncate ${
                    s.status === "approved" ? "bg-success/20 text-success" :
                    s.status === "pending"  ? "bg-warning/20 text-warning" :
                    s.status === "completed"? "bg-primary/20 text-primary" :
                    "bg-destructive/15 text-destructive"}`}>
                    {s.start_time?.slice(0,5)} {isMobile ? "" : (role==="trainer" ? s.student?.full_name?.split(" ")[0] : s.session_type)}
                  </div>
                ))}
                {daySn.length > (isMobile ? 1 : 2) && (
                  <p className="text-[8px] text-muted-foreground font-bold pl-0.5">+{daySn.length - (isMobile ? 1 : 2)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <AppLayout>
      <div className="space-y-4">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <p className="label-overline mb-1">AGENDA</p>
          <h1 className="font-black text-2xl tracking-tight">{role === "trainer" ? "Agenda" : "Meus treinos"}</h1>
          {role === "student" && !profile?.trainer_id && (
            <p className="text-sm text-destructive font-medium mt-2 bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/20">
              ⚠️ Vincule-se a um personal primeiro em Configurações.
            </p>
          )}
        </motion.div>

        {/* Student info */}
        {role === "student" && profile?.trainer_id && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.3}>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Agenda controlada pelo seu personal</p>
                <p className="text-xs text-muted-foreground mt-0.5">Para agendar ou cancelar, envie uma mensagem.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/messages")} className="shrink-0 rounded-xl">Mensagem</Button>
            </div>
          </motion.div>
        )}

        {/* Makeup sessions */}
        {role === "student" && (makeupSessions ?? []).length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-warning" />
              <p className="text-sm font-bold text-warning">Reposições disponíveis</p>
            </div>
            {(makeupSessions ?? []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between bg-background/50 rounded-xl px-3 py-2 border border-border/50">
                <div>
                  <p className="text-xs font-bold">{s.session_type || "Treino"} — {format(parseISO(s.date), "dd/MM")}</p>
                  <p className="text-[10px] text-muted-foreground">Repor até {format(parseISO(s.makeup_deadline), "dd/MM/yyyy")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/messages")} className="text-xs rounded-xl h-8">Pedir</Button>
              </div>
            ))}
          </div>
        )}

        {/* ── View toggle + nav ────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.6}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
            {([["day","Dia"],["week","Semana"],["month","Mês"]] as [ViewMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => { setViewMode(key); setOffset(0); setSelectedDate(new Date()); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
                  viewMode === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                <CalendarRange className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button onClick={() => setOffset(o => o - 1)} className="p-2 hover:bg-muted rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <p className="font-bold text-sm px-2 capitalize min-w-[140px] text-center">{navLabel()}</p>
            <button onClick={() => setOffset(o => o + 1)} className="p-2 hover:bg-muted rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {offset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setOffset(0); setSelectedDate(new Date()); }} className="text-primary font-black text-xs ml-1">Hoje</Button>
            )}
          </div>
        </motion.div>

        {/* ══ VIEWS ════════════════════════════════════════ */}
        <AnimatePresence mode="wait">

          {/* DAY (mobile + desktop) */}
          {viewMode === "day" && (
            <motion.div key="day" variants={fadeUp} initial="hidden" animate="visible" custom={1} className="space-y-3">
              <p className="text-xs text-muted-foreground font-bold capitalize">
                {format(addDays(today, offset), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                {isToday(addDays(today, offset)) && <span className="ml-2 text-primary">· Hoje</span>}
              </p>
              <DayColumn day={addDays(today, offset)} />
            </motion.div>
          )}

          {/* WEEK */}
          {viewMode === "week" && (
            <motion.div key="week" variants={fadeUp} initial="hidden" animate="visible" custom={1} className="space-y-3">
              {isMobile ? (
                <>
                  {/* Mobile week: strip + day cards */}
                  <DayStrip days={weekDays} />
                  <div>
                    <p className="text-xs text-muted-foreground font-bold mb-2 capitalize">
                      {format(selectedDate, "EEEE, dd/MM", { locale: ptBR })}
                      {isToday(selectedDate) && <span className="ml-2 text-primary">· Hoje</span>}
                    </p>
                    <DayColumn day={selectedDate} />
                  </div>
                </>
              ) : (
                <DesktopWeekGrid />
              )}
            </motion.div>
          )}

          {/* MONTH */}
          {viewMode === "month" && (
            <motion.div key="month" variants={fadeUp} initial="hidden" animate="visible" custom={1}>
              <MonthGrid />
              <p className="text-xs text-muted-foreground text-center mt-2">Toque em um dia para ver os detalhes</p>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] bg-card border border-border rounded-2xl p-3 px-4">
          {[
            { label: "Confirmado", dot: "bg-success" },
            { label: "Pendente",   dot: "bg-warning" },
            { label: "Concluído",  dot: "bg-primary" },
            { label: "Falta",      dot: "bg-destructive" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span className="text-muted-foreground font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Trainer FAB (mobile, week/day view) ══ */}
      {role === "trainer" && isMobile && viewMode !== "month" && (
        <button
          onClick={() => openCreate(viewMode === "day" ? addDays(today, offset) : selectedDate)}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/40 flex items-center justify-center press-scale">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      {/* ══ CREATE SESSION MODAL ════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
            <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="bg-background border border-border w-full sm:max-w-md rounded-2xl shadow-2xl overflow-y-auto"
            style={{ 
              maxHeight: "82dvh",
              overscrollBehavior: "contain"
            }}
            onClick={e => e.stopPropagation()}>
            <div className="p-5 space-y-5"
              style={{ paddingBottom: "100px" }}>
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-muted mx-auto sm:hidden" />
              <div className="flex items-center justify-between">
                <p className="label-overline text-primary">AGENDAR SESSÃO</p>
                <button onClick={() => setShowModal(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-xl">
                  <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </button>
              </div>

              {/* Date + time */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <label className="label-overline text-primary text-[9px]">Data</label>
                <p className="font-black text-sm mt-0.5">
                  {modalDate ? format(parseISO(modalDate), "dd/MM/yyyy (EEEE)", { locale: ptBR }) : "—"}
                </p>
              </div>

              {/* Time picker */}
              <div>
                <label className="label-overline mb-2 block">HORÁRIO</label>
                <div className="flex flex-wrap gap-1.5">
                  {HOURS.map(h => {
                    const isPast = modalDate ? isBefore(parseISO(`${modalDate}T${h}`), new Date()) : false;
                    const isOccupied = (sessions ?? []).some(s => 
                      s.date === modalDate && 
                      s.start_time?.slice(0, 5) === h && 
                      !["cancelled", "rejected"].includes(s.status)
                    );
                    const isDisabled = isPast || isOccupied;

                    return (
                      <button key={h} onClick={() => !isDisabled && setModalTime(h)} disabled={isDisabled}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isDisabled ? "opacity-30 cursor-not-allowed bg-muted/50 text-muted-foreground line-through"
                          : modalTime === h ? "bg-primary text-white" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}>
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student */}
              <div>
                <label className="label-overline mb-2 flex items-center gap-1.5"><Users className="h-3 w-3" /> ALUNO</label>
                {students && students.length > 0 ? (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {students.map((s: any) => (
                      <button key={s.user_id} onClick={() => setSelectedStudentId(s.user_id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                          selectedStudentId === s.user_id ? "bg-primary text-white" : "bg-muted/50 hover:bg-muted"
                        }`}>
                        <div className="w-7 h-7 rounded-full bg-primary/25 flex items-center justify-center text-[10px] font-black shrink-0">
                          {s.full_name?.charAt(0)}
                        </div>
                        <span className="text-xs font-bold truncate">{s.full_name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl">Nenhum aluno vinculado.</p>
                )}
              </div>

              {/* Makeup */}
              {selectedStudentId && (() => {
                const makeups = (sessions ?? []).filter(s =>
                  s.student_id === selectedStudentId && s.status === "missed" &&
                  (s as any).makeup_deadline && new Date((s as any).makeup_deadline) >= new Date()
                );
                if (!makeups.length) return null;
                return (
                  <div>
                    <label className="label-overline mb-2 flex items-center gap-1.5"><RotateCcw className="h-3 w-3" /> REPOSIÇÃO (opcional)</label>
                    <div className="space-y-1">
                      {makeups.map((ms: any) => (
                        <button key={ms.id} onClick={() => setSelectedMakeupId(selectedMakeupId === ms.id ? null : ms.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                            selectedMakeupId === ms.id ? "bg-warning/15 border border-warning/30 text-warning" : "bg-muted/30 border border-border"
                          }`}>
                          <span className="font-bold">{ms.session_type || "Treino"} — {format(parseISO(ms.date), "dd/MM")}</span>
                          <span className="text-muted-foreground">até {format(parseISO(ms.makeup_deadline), "dd/MM")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Type */}
              <div>
                <label className="label-overline mb-2 block">TIPO DE TREINO</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SESSION_TYPES.map(t => (
                    <button key={t} onClick={() => setSessionType(t)}
                      className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                        sessionType === t ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label-overline mb-1.5 block">OBSERVAÇÃO (opcional)</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação..." className="h-12 rounded-xl" />
              </div>

              <Button onClick={handleCreate} disabled={createSession.isPending || !selectedStudentId} className="w-full h-12 text-base rounded-xl font-black">
                {createSession.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Criando...</> : selectedMakeupId ? "Agendar reposição" : "Agendar sessão"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
};

export default SchedulePage;
