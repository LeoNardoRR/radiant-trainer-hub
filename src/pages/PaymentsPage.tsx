import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Plus, X, Loader2, CheckCircle2, Clock, AlertTriangle,
  XCircle, Users, TrendingUp, Package, ChevronDown, ChevronUp, Trash2, CreditCard, UserPlus,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PlanGate from "@/components/PlanGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  usePaymentPlans, useCreatePaymentPlan, useDeletePaymentPlan,
  usePayments, useCreatePayment, useUpdatePaymentStatus, useFinancialSummary, useStudentPayments,
} from "@/hooks/usePayments";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

const statusConfig = {
  pending: { label: "Pendente", color: "text-warning", bg: "bg-warning/10", icon: Clock },
  paid: { label: "Pago", color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
  overdue: { label: "Atrasado", color: "text-risk", bg: "bg-risk/10", icon: AlertTriangle },
  cancelled: { label: "Cancelado", color: "text-muted-foreground", bg: "bg-muted", icon: XCircle },
};

const PaymentsPage = () => {
  const { role, user } = useAuth();
  const isTrainer = role === "trainer";

  const [tab, setTab] = useState<"payments" | "plans" | "assignments">("payments");
  const [showAssign, setShowAssign] = useState(false);
  const [assignStudent, setAssignStudent] = useState("");
  const [assignPlan, setAssignPlan] = useState("");
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // New payment form
  const [payStudent, setPayStudent] = useState("");
  const [payPlan, setPayPlan] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDue, setPayDue] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payNotes, setPayNotes] = useState("");

  // New plan form
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planSessions, setPlanSessions] = useState("");
  const [planDesc, setPlanDesc] = useState("");

  const { data: students } = useStudents();
  const { data: plans } = usePaymentPlans();
  const { data: payments, isLoading } = usePayments();
  const { data: myPayments } = useStudentPayments();
  const { data: summary } = useFinancialSummary();

  const qc = useQueryClient();

  // Student plan assignments
  const { data: assignments } = useQuery({
    queryKey: ["plan-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_plan_assignments" as any)
        .select("*")
        .eq("trainer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Enrich with student + plan names
      const rows = data as any[];
      const studentIds = [...new Set(rows.map(r => r.student_id))];
      const planIds = [...new Set(rows.map(r => r.plan_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", studentIds);
      const { data: planData } = await supabase.from("payment_plans" as any).select("id, name, price").in("id", planIds);
      const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const plMap = new Map(((planData as any[]) || []).map(p => [p.id, p]));
      return rows.map(r => ({ ...r, student: pMap.get(r.student_id), plan: plMap.get(r.plan_id) }));
    },
    enabled: !!user && isTrainer,
  });

  const assignPlanMutation = useMutation({
    mutationFn: async ({ student_id, plan_id }: { student_id: string; plan_id: string }) => {
      const { error } = await supabase
        .from("student_plan_assignments" as any)
        .insert({ student_id, plan_id, trainer_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-assignments"] });
      toast.success("Plano atribuído ao aluno!");
      setShowAssign(false);
      setAssignStudent("");
      setAssignPlan("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_plan_assignments" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-assignments"] });
      toast.success("Atribuição removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPayment = useCreatePayment();
  const updateStatus = useUpdatePaymentStatus();
  const createPlan = useCreatePaymentPlan();
  const deletePlan = useDeletePaymentPlan();

  const filteredPayments = (isTrainer ? payments || [] : myPayments || []).filter((p: any) =>
    statusFilter === "all" || p.status === statusFilter
  );

  const handleCreatePayment = async () => {
    if (!payStudent || !payAmount || !payDue) return;
    await createPayment.mutateAsync({
      student_id: payStudent,
      amount: Number(payAmount),
      due_date: payDue,
      plan_id: payPlan || undefined,
      reference_month: payMonth || undefined,
      notes: payNotes || undefined,
    });
    setShowNewPayment(false);
    setPayStudent(""); setPayPlan(""); setPayAmount(""); setPayNotes("");
  };

  const handleCreatePlan = async () => {
    if (!planName || !planPrice) return;
    await createPlan.mutateAsync({
      name: planName,
      price: Number(planPrice),
      sessions_per_month: planSessions ? Number(planSessions) : undefined,
      description: planDesc || undefined,
    });
    setShowNewPlan(false);
    setPlanName(""); setPlanPrice(""); setPlanSessions(""); setPlanDesc("");
  };

  // Auto-fill amount when plan selected
  const handlePlanSelect = (planId: string) => {
    setPayPlan(planId);
    const selectedPlan = plans?.find((p: any) => p.id === planId);
    if (selectedPlan) setPayAmount(String(selectedPlan.price));
  };

  return (
    <AppLayout>
      {isTrainer ? (
        <PlanGate feature="financial">
          <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">FINANCEIRO</p>
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Gestão Financeira</h1>
          </div>
          {isTrainer && (
            <Button onClick={() => {
              if (tab === "payments") setShowNewPayment(true);
              else if (tab === "plans") setShowNewPlan(true);
              else setShowAssign(true);
            }} className="gap-2 rounded-xl h-11">
              <Plus className="h-4 w-4" />
              {tab === "payments" ? "Nova cobrança" : tab === "plans" ? "Novo plano" : "Atribuir plano"}
            </Button>
          )}
        </motion.div>

        {/* Summary cards (trainer only) */}
        {isTrainer && summary && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Receita do mês", value: `R$ ${summary.monthRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
              { label: "Total recebido", value: `R$ ${summary.totalRevenuePaid.toFixed(0)}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
              { label: "Pendente", value: `R$ ${summary.pendingAmount.toFixed(0)}`, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
              { label: "Atrasado", value: `R$ ${summary.overdueAmount.toFixed(0)}`, icon: AlertTriangle, color: summary.overdueAmount > 0 ? "text-risk" : "text-success", bg: summary.overdueAmount > 0 ? "bg-risk/10" : "bg-success/10" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-xl font-black">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Tabs */}
        {isTrainer && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="flex gap-2">
            {[
              { key: "payments", label: "Cobranças", icon: CreditCard },
              { key: "plans", label: "Planos", icon: Package },
              { key: "assignments", label: "Alunos", icon: UserPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key as any)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── TAB: Cobranças ─────────────────────────── */}
        {(tab === "payments" || !isTrainer) && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-4">
            {/* Status filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: "all", label: "Todos" },
                { key: "pending", label: "Pendente" },
                { key: "paid", label: "Pago" },
                { key: "overdue", label: "Atrasado" },
              ].map((f) => (
                <button key={f.key} onClick={() => setStatusFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[36px] ${statusFilter === f.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <DollarSign className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-semibold text-sm">Nenhuma cobrança encontrada</p>
                {isTrainer && <p className="text-xs text-muted-foreground mt-1">Crie uma cobrança para um aluno.</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPayments.map((payment: any, i: number) => {
                  const sc = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
                  const isOverdue = payment.status === "pending" && payment.due_date < new Date().toISOString().split("T")[0];
                  const displayStatus = isOverdue ? "overdue" : payment.status;
                  const dsc = statusConfig[displayStatus as keyof typeof statusConfig] || sc;
                  const StatusIcon = dsc.icon;

                  return (
                    <motion.div key={payment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${dsc.bg} flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`h-5 w-5 ${dsc.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {isTrainer && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground font-medium">{payment.student?.full_name || "—"}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-base">R$ {Number(payment.amount).toFixed(2)}</p>
                            {payment.payment_plans?.name && (
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{payment.payment_plans.name}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vencimento: {format(parseISO(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            {payment.reference_month && ` · Ref: ${payment.reference_month}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${dsc.bg} ${dsc.color}`}>
                            {dsc.label}
                          </span>
                          {isTrainer && payment.status !== "paid" && payment.status !== "cancelled" && (
                            <div className="flex gap-1">
                              <button onClick={() => updateStatus.mutate({ id: payment.id, status: "paid", student_id: payment.student_id })}
                                className="text-[10px] bg-success/10 text-success border border-success/20 px-2.5 py-1.5 rounded-lg hover:bg-success hover:text-success-foreground transition-colors font-semibold min-h-[28px]">
                                ✓ Pago
                              </button>
                              <button onClick={() => updateStatus.mutate({ id: payment.id, status: "cancelled", student_id: payment.student_id })}
                                className="text-[10px] bg-muted text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-risk/10 hover:text-risk transition-colors font-semibold min-h-[28px]">
                                ✗
                              </button>
                            </div>
                          )}
                          {payment.status === "paid" && payment.paid_at && (
                            <p className="text-[10px] text-muted-foreground">Pago em {format(new Date(payment.paid_at), "dd/MM", { locale: ptBR })}</p>
                          )}
                        </div>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-muted-foreground mt-2 ml-14 italic">{payment.notes}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── TAB: Planos ────────────────────────────── */}
        {isTrainer && tab === "plans" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-3">
            {!plans || plans.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-semibold text-sm">Nenhum plano criado</p>
                <p className="text-xs text-muted-foreground mt-1">Crie planos para facilitar as cobranças.</p>
              </div>
            ) : (
              plans.map((plan: any, i: number) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/20 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{plan.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm font-bold text-success">R$ {Number(plan.price).toFixed(2)}/mês</p>
                      {plan.sessions_per_month && (
                        <span className="text-[10px] text-muted-foreground">{plan.sessions_per_month} aulas/mês</span>
                      )}
                    </div>
                    {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                  </div>
                  <button onClick={() => { if (confirm("Remover plano?")) deletePlan.mutate(plan.id); }}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-risk/10 rounded-xl transition-colors">
                    <Trash2 className="h-4 w-4 text-risk" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ── TAB: Atribuições de Planos ────────────── */}
        {isTrainer && tab === "assignments" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-3">
            {!assignments || assignments.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <UserPlus className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="font-semibold text-sm">Nenhum plano atribuído</p>
                <p className="text-xs text-muted-foreground mt-1">Atribua planos aos seus alunos para facilitar cobranças.</p>
                <Button onClick={() => setShowAssign(true)} className="mt-4 gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> Atribuir plano
                </Button>
              </div>
            ) : (
              assignments.map((a: any, i: number) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/20 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-primary">
                      {a.student?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{a.student?.full_name || "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                        {a.plan?.name || "—"}
                      </span>
                      <span className="text-xs font-bold text-success">
                        R$ {Number(a.plan?.price || 0).toFixed(2)}/mês
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Desde {new Date(a.start_date).toLocaleDateString("pt-BR")}
                      {a.is_active
                        ? <span className="text-success ml-1.5">· Ativo</span>
                        : <span className="text-muted-foreground ml-1.5">· Inativo</span>
                      }
                    </p>
                  </div>
                  <button onClick={() => { if (confirm("Remover atribuição?")) removeAssignment.mutate(a.id); }}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-risk/10 rounded-xl transition-colors shrink-0">
                    <Trash2 className="h-4 w-4 text-risk" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modal: Nova Cobrança ──────────────────── */}
      <AnimatePresence>
        {showNewPayment && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowNewPayment(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-base">Nova Cobrança</p>
                <button onClick={() => setShowNewPayment(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aluno</label>
                  <select value={payStudent} onChange={(e) => setPayStudent(e.target.value)}
                    className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Selecione um aluno...</option>
                    {(students || []).map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
                  </select>
                </div>
                {plans && plans.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plano (opcional)</label>
                    <select value={payPlan} onChange={(e) => handlePlanSelect(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Nenhum plano</option>
                      {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Valor (R$)</label>
                    <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="150.00" className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Vencimento</label>
                    <Input type="date" value={payDue} onChange={(e) => setPayDue(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Referência (mês)</label>
                  <Input type="month" value={payMonth} onChange={(e) => setPayMonth(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Observações</label>
                  <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Observações..." className="h-11 rounded-xl" />
                </div>
                <Button onClick={handleCreatePayment} disabled={!payStudent || !payAmount || !payDue || createPayment.isPending} className="w-full h-12 rounded-xl">
                  {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar cobrança
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Novo Plano ──────────────────────── */}
      <AnimatePresence>
        {showNewPlan && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowNewPlan(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-base">Novo Plano</p>
                <button onClick={() => setShowNewPlan(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do plano</label>
                  <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Ex: Mensal 8 aulas" className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Preço (R$)</label>
                    <Input type="number" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} placeholder="350.00" className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aulas/mês</label>
                    <Input type="number" value={planSessions} onChange={(e) => setPlanSessions(e.target.value)} placeholder="8" className="h-12 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição</label>
                  <Input value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Detalhes do plano..." className="h-11 rounded-xl" />
                </div>
                <Button onClick={handleCreatePlan} disabled={!planName || !planPrice || createPlan.isPending} className="w-full h-12 rounded-xl">
                  {createPlan.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Criar plano
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Atribuir Plano a Aluno ────────── */}
      <AnimatePresence>
        {showAssign && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between mb-5">
                  <p className="font-bold text-base">Atribuir Plano</p>
                  <button onClick={() => setShowAssign(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aluno</label>
                    <select value={assignStudent} onChange={(e) => setAssignStudent(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecione um aluno...</option>
                      {(students || []).map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plano</label>
                    {!plans || plans.length === 0 ? (
                      <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl">
                        Nenhum plano criado. Crie um plano na aba "Planos" primeiro.
                      </p>
                    ) : (
                      <select value={assignPlan} onChange={(e) => setAssignPlan(e.target.value)}
                        className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Selecione um plano...</option>
                        {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}/mês</option>)}
                      </select>
                    )}
                  </div>
                  <Button
                    onClick={() => assignPlanMutation.mutate({ student_id: assignStudent, plan_id: assignPlan })}
                    disabled={!assignStudent || !assignPlan || assignPlanMutation.isPending}
                    className="w-full h-12 rounded-xl">
                    {assignPlanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Atribuir plano
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </PlanGate>
      ) : (
        /* Student — sees their own payment history (no gate needed) */
        <div className="space-y-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">FINANCEIRO</p>
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Meus Pagamentos</h1>
          </motion.div>
          {/* Student payments list rendered by the existing filteredPayments logic above */}
        </div>
      )}
    </AppLayout>
  );
};

export default PaymentsPage;
