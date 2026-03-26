import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useStudents } from "@/hooks/useStudents";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

type FilterStatus = "all" | "active" | "at_risk" | "inactive";

const statusConfig = {
  active: { label: "Ativo", class: "status-active" },
  inactive: { label: "Inativo", class: "status-inactive" },
  at_risk: { label: "Em risco", class: "status-at-risk" },
};

const StudentsPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const { data: students, isLoading } = useStudents();

  const filtered = (students || []).filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    all: students?.length || 0,
    active: students?.filter((s) => s.status === "active").length || 0,
    at_risk: students?.filter((s) => s.status === "at_risk").length || 0,
    inactive: students?.filter((s) => s.status === "inactive").length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">ALUNOS</p>
          <h1 className="font-display font-light text-2xl md:text-3xl tracking-tight">Gestão de alunos</h1>
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno..."
              className="pl-10 font-body font-light h-12 w-full sm:max-w-sm"
            />
          </div>
          <div className="flex gap-[1px] bg-border overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {(["all", "active", "at_risk", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-editorial-sm text-[9px] whitespace-nowrap transition-colors duration-300 min-h-[44px] ${
                  filter === f ? "bg-foreground text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground active:bg-accent"
                }`}
              >
                {f === "all" ? "Todos" : f === "active" ? "Ativos" : f === "at_risk" ? "Em risco" : "Inativos"} ({counts[f]})
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body font-light py-12 text-center animate-pulse">
              Carregando...
            </p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground font-body font-light">
                {students?.length === 0 ? "Nenhum aluno cadastrado ainda." : "Nenhum resultado encontrado."}
              </p>
              {students?.length === 0 && (
                <p className="text-xs text-muted-foreground font-body font-light mt-2">
                  Gere um código de convite em Configurações e compartilhe com seus alunos.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {filtered.map((student) => {
                const sc = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.active;
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 py-4 border-b border-border hover:bg-accent/30 active:bg-accent/50 transition-colors duration-300 px-2 -mx-2 cursor-pointer group min-h-[64px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <span className="text-sm font-display">{student.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm truncate">{student.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-body font-light truncate">{student.email}</p>
                    </div>
                    <span className={`status-badge ${sc.class}`}>{sc.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default StudentsPage;
