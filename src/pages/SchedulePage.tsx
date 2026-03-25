import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const hours = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

type SessionStatus = "booked" | "pending" | "available" | "blocked";

interface Session {
  day: number;
  hour: string;
  student?: string;
  status: SessionStatus;
}

const mockSessions: Session[] = [
  { day: 0, hour: "07:00", student: "Roberto Lima", status: "booked" },
  { day: 0, hour: "08:00", student: "Fernanda Alves", status: "booked" },
  { day: 0, hour: "09:00", student: "Marcos Paulo", status: "booked" },
  { day: 0, hour: "10:00", student: "Camila Torres", status: "pending" },
  { day: 0, hour: "14:00", status: "available" },
  { day: 0, hour: "16:00", student: "Bruno Santos", status: "booked" },
  { day: 1, hour: "07:00", student: "Ana Silva", status: "pending" },
  { day: 1, hour: "08:00", student: "Carlos Mendes", status: "pending" },
  { day: 1, hour: "09:00", status: "available" },
  { day: 1, hour: "14:00", status: "available" },
  { day: 1, hour: "16:00", student: "Julia Santos", status: "pending" },
  { day: 2, hour: "07:00", status: "available" },
  { day: 2, hour: "08:00", student: "Maria Oliveira", status: "booked" },
  { day: 2, hour: "09:00", status: "available" },
  { day: 2, hour: "14:00", student: "Pedro Costa", status: "booked" },
  { day: 3, hour: "07:00", student: "Lucas Ferreira", status: "booked" },
  { day: 3, hour: "08:00", status: "available" },
  { day: 3, hour: "16:00", status: "blocked" },
  { day: 4, hour: "07:00", student: "Roberto Lima", status: "booked" },
  { day: 4, hour: "09:00", student: "Fernanda Alves", status: "booked" },
  { day: 4, hour: "14:00", status: "available" },
  { day: 5, hour: "08:00", student: "Marcos Paulo", status: "booked" },
  { day: 5, hour: "09:00", status: "available" },
];

const getStatusClass = (status: SessionStatus) => {
  switch (status) {
    case "booked": return "bg-foreground/5 border-foreground/10";
    case "pending": return "bg-warning/5 border-warning/20";
    case "available": return "border-dashed border-border hover:border-foreground/30 cursor-pointer";
    case "blocked": return "bg-muted/50 border-border opacity-40";
  }
};

const SchedulePage = () => {
  const [weekOffset, setWeekOffset] = useState(0);

  const getSession = (day: number, hour: string) =>
    mockSessions.find((s) => s.day === day && s.hour === hour);

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-2">AGENDA</p>
            <h1 className="font-display font-light text-3xl tracking-tight">Sua semana</h1>
          </div>
          <Button size="sm" className="text-editorial-sm gap-2">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Novo horário
          </Button>
        </motion.div>

        {/* Week nav */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex items-center gap-4">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1 hover:bg-accent rounded transition-colors">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <p className="font-display text-sm">
            {weekOffset === 0 ? "Esta semana" : weekOffset === 1 ? "Próxima semana" : weekOffset === -1 ? "Semana passada" : `Semana ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </p>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1 hover:bg-accent rounded transition-colors">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </motion.div>

        {/* Grid */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-[60px_repeat(6,1fr)] gap-[1px] bg-border mb-[1px]">
              <div className="bg-background" />
              {weekDays.map((day) => (
                <div key={day} className="bg-background py-3 text-center">
                  <p className="text-editorial-sm text-muted-foreground">{day}</p>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(6,1fr)] gap-[1px] bg-border mb-[1px]">
                <div className="bg-background py-3 px-2 flex items-center">
                  <span className="font-display text-xs text-muted-foreground">{hour}</span>
                </div>
                {weekDays.map((_, dayIdx) => {
                  const session = getSession(dayIdx, hour);
                  if (!session) {
                    return <div key={dayIdx} className="bg-background py-3" />;
                  }
                  return (
                    <div
                      key={dayIdx}
                      className={`bg-background p-2 border ${getStatusClass(session.status)} transition-all duration-300`}
                    >
                      {session.student ? (
                        <div>
                          <p className="text-xs font-body truncate">{session.student}</p>
                          {session.status === "pending" && (
                            <span className="status-badge status-pending mt-1 inline-block">Pendente</span>
                          )}
                        </div>
                      ) : session.status === "available" ? (
                        <p className="text-xs text-muted-foreground font-body font-light text-center">+</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-wrap gap-6">
          {[
            { label: "Confirmado", class: "bg-foreground/5 border-foreground/10" },
            { label: "Pendente", class: "bg-warning/5 border-warning/20" },
            { label: "Disponível", class: "border-dashed border-border" },
            { label: "Bloqueado", class: "bg-muted/50 border-border opacity-40" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-4 h-4 border ${item.class}`} />
              <span className="text-xs font-body text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SchedulePage;
