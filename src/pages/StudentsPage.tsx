import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, UserPlus } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/useStudents";
import EmptyState from "@/components/EmptyState";
import StudentDetailSheet from "@/components/StudentDetailSheet";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

type FilterStatus = "all" | "active" | "at_risk" | "inactive";

const statusConfig = {
  active: { label: "Ativo", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  inactive: { label: "Inativo", color: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
  at_risk: { label: "Em risco", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
};

const StudentsPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
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

  const filterConfig: { key: FilterStatus; label: string; activeClass: string }[] = [
    { key: "all", label: "Todos", activeClass: "bg-primary text-primary-foreground" },
    { key: "active", label: "Ativos", activeClass: "bg-success text-success-foreground" },
    { key: "at_risk", label: "Em risco", activeClass: "bg-warning text-warning-foreground" },
    { key: "inactive", label: "Inativos", activeClass: "bg-muted text-muted-foreground" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-1">ALUNOS</p>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Gestão de alunos</h1>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <UserPlus className="h-4 w-4" /> Convidar
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno..."
              className="pl-10 font-body h-12 w-full sm:max-w-sm rounded-xl" />
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {filterConfig.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-xs font-display font-medium rounded-full whitespace-nowrap transition-all min-h-[36px] ${
                  filter === f.key ? f.activeClass + " shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                }`}>
                {f.label} ({counts[f.key]})
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            students?.length === 0 ? (
              <EmptyState
                icon={Users}
                emoji="👥"
                title="Nenhum aluno cadastrado"
                description="Gere um código de convite em Configurações e compartilhe com seus alunos para começar."
                action={
                  <Link to="/settings">
                    <Button className="gap-1.5">
                      <UserPlus className="h-4 w-4" /> Gerar convite
                    </Button>
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={Search} title="Nenhum resultado" description="Tente ajustar os filtros ou busca." />
            )
          ) : (
            <div className="space-y-1.5">
              {filtered.map((student, i) => {
                const sc = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.active;
                const avatarColors = ["bg-primary/10 text-primary", "bg-success/10 text-success", "bg-warning/10 text-warning"];
                const colorIdx = student.full_name.charCodeAt(0) % avatarColors.length;
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedStudent(student)}
                    className="flex items-center gap-3 py-3 px-4 border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm active:scale-[0.99] transition-all duration-200 cursor-pointer group min-h-[68px] bg-card"
                  >
                    <div className={`w-11 h-11 rounded-xl ${avatarColors[colorIdx]} flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-display font-bold">{student.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate">{student.full_name}</p>
                      <p className="text-[11px] text-muted-foreground font-body truncate">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      <span className={`text-[10px] font-display uppercase tracking-wider font-semibold ${sc.color} hidden sm:inline`}>
                        {sc.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Student Detail Sheet */}
      {selectedStudent && (
        <StudentDetailSheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </AppLayout>
  );
};

export default StudentsPage;
