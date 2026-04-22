import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, DollarSign, Dumbbell, Shield, TrendingUp,
  ChevronRight, Loader2, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

const AdminPage = () => {
  const { role } = useAuth();
  const [tab, setTab] = useState<"overview" | "trainers" | "students" | "payments">("overview");

  // Guard: only admin
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  // All trainers
  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ["admin-trainers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "trainer")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // All students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // All payments
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments" as any)
        .select("*, payment_plans(*)")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const totalRevenue = (payments || [])
    .filter((p: any) => p.status === "paid")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);

  const pendingRevenue = (payments || [])
    .filter((p: any) => p.status === "pending")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);

  const today = new Date().toISOString().split("T")[0];

  const statCards = [
    { label: "Trainers", value: trainers?.length ?? "—", icon: Shield, color: "text-primary", bg: "bg-primary/10" },
    { label: "Alunos", value: students?.length ?? "—", icon: Users, color: "text-success", bg: "bg-success/10" },
    { label: "Receita total", value: `R$ ${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-warning", bg: "bg-warning/10" },
    { label: "A receber", value: `R$ ${pendingRevenue.toFixed(0)}`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
  ];

  const tabs = [
    { key: "overview", label: "Visão Geral" },
    { key: "trainers", label: `Trainers (${trainers?.length ?? 0})` },
    { key: "students", label: `Alunos (${students?.length ?? 0})` },
    { key: "payments", label: `Pagamentos (${payments?.length ?? 0})` },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: "Pendente", color: "text-warning", bg: "bg-warning/10", icon: Clock },
    paid: { label: "Pago", color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
    overdue: { label: "Atrasado", color: "text-risk", bg: "bg-risk/10", icon: AlertTriangle },
    cancelled: { label: "Cancelado", color: "text-muted-foreground", bg: "bg-muted", icon: AlertTriangle },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">ADMINISTRADOR</p>
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Painel Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Visão global de toda a plataforma.</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xl font-black">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] shrink-0 ${
                tab === key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}>
              {label}
            </button>
          ))}
        </motion.div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Últimos pagamentos</p>
              {loadingPayments ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>
              ) : (payments || []).slice(0, 8).map((p: any) => {
                const ds = p.status === "pending" && p.due_date < today ? "overdue" : p.status;
                const sc = statusConfig[ds] || statusConfig.pending;
                const Icon = sc.icon;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${sc.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">R$ {Number(p.amount).toFixed(2)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Venc. {p.due_date ? format(parseISO(p.due_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} shrink-0`}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── TRAINERS ── */}
        {tab === "trainers" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-2">
            {loadingTrainers ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
            ) : !trainers?.length ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold">Nenhum trainer cadastrado</p>
              </div>
            ) : trainers.map((t: any, i: number) => (
              <motion.div key={t.user_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-primary">{t.full_name?.charAt(0) ?? "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.email}</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold shrink-0">Trainer</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── STUDENTS ── */}
        {tab === "students" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-2">
            {loadingStudents ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
            ) : !students?.length ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold">Nenhum aluno cadastrado</p>
              </div>
            ) : students.map((s: any, i: number) => (
              <motion.div key={s.user_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-success">{s.full_name?.charAt(0) ?? "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                  s.status === "active" ? "bg-success/10 text-success" :
                  s.status === "at_risk" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>{s.status === "active" ? "Ativo" : s.status === "at_risk" ? "Em risco" : "Inativo"}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === "payments" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-2">
            {loadingPayments ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
            ) : !payments?.length ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <DollarSign className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold">Nenhum pagamento</p>
              </div>
            ) : payments.map((p: any, i: number) => {
              const ds = p.status === "pending" && p.due_date < today ? "overdue" : p.status;
              const sc = statusConfig[ds] || statusConfig.pending;
              const Icon = sc.icon;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${sc.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${sc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">R$ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Venc. {p.due_date ? format(parseISO(p.due_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      {p.payment_plans?.name && ` · ${p.payment_plans.name}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${sc.bg} ${sc.color} shrink-0`}>
                    {sc.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminPage;
