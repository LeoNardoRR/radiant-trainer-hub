import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useStudents, Student } from "@/hooks/useStudents";
import { Skeleton } from "@/components/ui/skeleton";
import StudentDetailSheet from "@/components/StudentDetailSheet";
import { Link } from "react-router-dom";

type FilterStatus = "all" | "active" | "at_risk" | "inactive";

const statusDot: Record<string, string> = {
  active:   "bg-success",
  inactive: "bg-muted-foreground/40",
  at_risk:  "bg-warning",
};
const statusLabel: Record<string, string> = {
  active: "Ativo", inactive: "Inativo", at_risk: "Em risco",
};
const statusTextColor: Record<string, string> = {
  active: "text-success", inactive: "text-muted-foreground", at_risk: "text-warning",
};

const AVATAR_COLORS = [
  "bg-orange-500/15 text-orange-600",
  "bg-violet-500/15 text-violet-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-blue-500/15 text-blue-600",
  "bg-rose-500/15 text-rose-600",
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item    = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const StudentsPage = () => {
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState<FilterStatus>("all");
  const [selectedStudent, setSelected]    = useState<Student | null>(null);
  const { data: students, isLoading }     = useStudents();

  const counts = {
    all:      students?.length ?? 0,
    active:   students?.filter((s) => s.status === "active").length   ?? 0,
    at_risk:  students?.filter((s) => s.status === "at_risk").length  ?? 0,
    inactive: students?.filter((s) => s.status === "inactive").length ?? 0,
  };

  const filtered = (students ?? []).filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AppLayout>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <p className="label-overline mb-1">Alunos</p>
            <h1 className="text-2xl font-black tracking-tight">
              {counts.all} {counts.all === 1 ? "aluno" : "alunos"}
            </h1>
          </div>
          <Link to="/settings"
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold press-scale">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Convidar</span>
          </Link>
        </motion.div>

        {/* Search + filters */}
        <motion.div variants={item} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="h-12 pl-10 rounded-2xl border-border bg-card text-sm"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            {([
              { key: "all",     label: "Todos" },
              { key: "active",  label: "Ativos" },
              { key: "at_risk", label: "Em risco" },
              { key: "inactive",label: "Inativos" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all min-h-[36px] shrink-0 ${
                  filter === f.key
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted-foreground hover:border-foreground/20"
                }`}>
                {f.label}
                <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-black ${
                  filter === f.key ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                }`}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div variants={item} className="py-16 text-center">
            <p className="text-sm font-semibold">
              {students?.length === 0 ? "Nenhum aluno cadastrado" : "Nenhum resultado"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {students?.length === 0
                ? "Gere um código de convite em Ajustes e compartilhe."
                : "Tente ajustar a busca ou os filtros."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2 pb-10">
            {filtered.map((student, i) => {
              const color  = AVATAR_COLORS[student.full_name.charCodeAt(0) % AVATAR_COLORS.length];
              const dot    = statusDot[student.status]      ?? statusDot.active;
              const label  = statusLabel[student.status]    ?? "Ativo";
              const tcolor = statusTextColor[student.status] ?? statusTextColor.active;

              return (
                <motion.button
                  key={student.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSelected(student)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 card-base hover:border-primary/25 press-scale text-left min-h-[68px]"
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center shrink-0 font-black text-base`}>
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{student.full_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{student.email}</p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wide hidden sm:inline ${tcolor}`}>
                      {label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-1" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Detail sheet */}
      {selectedStudent && (
        <StudentDetailSheet student={selectedStudent} onClose={() => setSelected(null)} />
      )}
    </AppLayout>
  );
};

export default StudentsPage;
