import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

type StudentStatus = "active" | "inactive" | "at-risk";

interface Student {
  id: number;
  name: string;
  email: string;
  status: StudentStatus;
  frequency: number;
  lastSession: string;
  totalSessions: number;
  streak: number;
}

const students: Student[] = [
  { id: 1, name: "Ana Silva", email: "ana@email.com", status: "active", frequency: 92, lastSession: "Hoje", totalSessions: 48, streak: 12 },
  { id: 2, name: "Carlos Mendes", email: "carlos@email.com", status: "active", frequency: 85, lastSession: "Ontem", totalSessions: 36, streak: 8 },
  { id: 3, name: "Fernanda Alves", email: "fernanda@email.com", status: "active", frequency: 78, lastSession: "Hoje", totalSessions: 62, streak: 15 },
  { id: 4, name: "Lucas Ferreira", email: "lucas@email.com", status: "active", frequency: 95, lastSession: "Ontem", totalSessions: 90, streak: 30 },
  { id: 5, name: "Maria Oliveira", email: "maria@email.com", status: "at-risk", frequency: 45, lastSession: "5 dias atrás", totalSessions: 24, streak: 0 },
  { id: 6, name: "Pedro Costa", email: "pedro@email.com", status: "at-risk", frequency: 38, lastSession: "4 dias atrás", totalSessions: 18, streak: 0 },
  { id: 7, name: "Julia Santos", email: "julia@email.com", status: "active", frequency: 88, lastSession: "Hoje", totalSessions: 42, streak: 10 },
  { id: 8, name: "Roberto Lima", email: "roberto@email.com", status: "active", frequency: 82, lastSession: "Ontem", totalSessions: 55, streak: 6 },
  { id: 9, name: "Camila Torres", email: "camila@email.com", status: "inactive", frequency: 12, lastSession: "15 dias atrás", totalSessions: 8, streak: 0 },
  { id: 10, name: "Bruno Santos", email: "bruno@email.com", status: "at-risk", frequency: 50, lastSession: "6 dias atrás", totalSessions: 30, streak: 0 },
];

const statusConfig: Record<StudentStatus, { label: string; class: string }> = {
  active: { label: "Ativo", class: "status-active" },
  inactive: { label: "Inativo", class: "status-inactive" },
  "at-risk": { label: "Em risco", class: "status-at-risk" },
};

const StudentsPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StudentStatus | "all">("all");

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: students.length,
    active: students.filter((s) => s.status === "active").length,
    "at-risk": students.filter((s) => s.status === "at-risk").length,
    inactive: students.filter((s) => s.status === "inactive").length,
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">ALUNOS</p>
          <h1 className="font-display font-light text-3xl tracking-tight">Gestão de alunos</h1>
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="pl-10 font-body font-light"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "at-risk", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-editorial-sm transition-colors duration-300 border ${
                  filter === f ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Ativos" : f === "at-risk" ? "Em risco" : "Inativos"} ({counts[f]})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 py-3 border-b border-border">
            <span className="text-editorial-sm text-muted-foreground">ALUNO</span>
            <span className="text-editorial-sm text-muted-foreground">STATUS</span>
            <span className="text-editorial-sm text-muted-foreground">FREQUÊNCIA</span>
            <span className="text-editorial-sm text-muted-foreground">ÚLTIMO TREINO</span>
            <span className="text-editorial-sm text-muted-foreground">SEQUÊNCIA</span>
            <span />
          </div>

          {/* Rows */}
          {filtered.map((student, i) => {
            const sc = statusConfig[student.status];
            return (
              <motion.div
                key={student.id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 3}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 md:gap-4 py-5 border-b border-border hover:bg-accent/30 transition-colors duration-300 px-2 -mx-2 cursor-pointer group"
              >
                <div>
                  <p className="font-body text-sm">{student.name}</p>
                  <p className="text-xs text-muted-foreground font-body font-light">{student.email}</p>
                </div>
                <div className="flex items-center">
                  <span className={`status-badge ${sc.class}`}>{sc.label}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-border overflow-hidden">
                      <div
                        className="h-full bg-foreground/60 transition-all duration-500"
                        style={{ width: `${student.frequency}%` }}
                      />
                    </div>
                    <span className="text-xs font-display text-muted-foreground">{student.frequency}%</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-body font-light text-muted-foreground">{student.lastSession}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-display">
                    {student.streak > 0 ? `${student.streak} dias` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default StudentsPage;
