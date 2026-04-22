import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, TrendingUp, AlertTriangle, Activity, Flame, Target,
  Zap, Edit3, Dumbbell, DollarSign, MessageSquare, Save, Loader2,
  Phone, Mail, User, ChevronDown,
} from "lucide-react";
import { useStudentStats } from "@/hooks/useStudents";
import { useStudentFitnessProfile } from "@/hooks/useStudentFitnessProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import StudentOnboardingModal from "@/components/StudentOnboardingModal";
import { useBodyMeasurements } from "@/hooks/useProgress";
import { useWorkoutPlans } from "@/hooks/useWorkouts";
import { usePayments } from "@/hooks/usePayments";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface StudentDetailSheetProps {
  student: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    status: string;
    avatar_url?: string | null;
  } | null;
  onClose: () => void;
}

const statusConfig = {
  active:   { label: "Ativo",    color: "text-success",          bg: "bg-success/10",  border: "border-success/20" },
  inactive: { label: "Inativo",  color: "text-muted-foreground", bg: "bg-muted",        border: "border-border" },
  at_risk:  { label: "Em risco", color: "text-warning",          bg: "bg-warning/10",  border: "border-warning/20" },
};

const objectiveLabels: Record<string, string> = {
  muscle_gain: "Ganhar massa",   weight_loss: "Emagrecer",
  conditioning: "Condicionamento", flexibility: "Flexibilidade", general: "Saúde geral",
};
const levelLabels: Record<string, string> = {
  beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado",
};
const locationLabels: Record<string, string> = {
  gym: "Academia", home: "Casa", outdoor: "Ao ar livre", hybrid: "Híbrido",
};

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-rose-500/15 text-rose-500",
  "bg-cyan-500/15 text-cyan-500",
];

type Tab = "overview" | "edit";

const StudentDetailSheet = ({ student, onClose }: StudentDetailSheetProps) => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: stats }          = useStudentStats(student?.user_id);
  const { data: fitnessProfile } = useStudentFitnessProfile(student?.user_id);
  const { data: measurements }   = useBodyMeasurements(student?.user_id);
  const { data: workoutPlans }   = useWorkoutPlans(student?.user_id);
  const { data: payments }       = usePayments(student?.user_id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tab, setTab]            = useState<Tab>("overview");

  // Edit form state — initialised from student prop
  const [editName,   setEditName]   = useState(student?.full_name  ?? "");
  const [editPhone,  setEditPhone]  = useState(student?.phone      ?? "");
  const [editStatus, setEditStatus] = useState<"active" | "at_risk" | "inactive">((student?.status as "active" | "at_risk" | "inactive") ?? "active");
  const [saving,     setSaving]     = useState(false);

  if (!student) return null;

  const sc       = statusConfig[student.status as keyof typeof statusConfig] ?? statusConfig.active;
  const colorIdx = student.full_name.charCodeAt(0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIdx];

  const latestMeasurement = measurements?.[0];
  const activePlans       = workoutPlans?.filter((p: any) => p.is_active) ?? [];
  const pendingPayment    = payments?.find((p: any) => p.status === "pending" || p.status === "overdue");
  const hasOverdue        = payments?.some((p: any) => p.status === "overdue");

  // ── Save edits ────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName.trim(), phone: editPhone.trim(), status: editStatus })
        .eq("user_id", student.user_id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Dados do aluno atualizados!");
      setTab("overview");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative bg-background border border-border w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-y-auto"
            style={{ maxHeight: "90dvh", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* ── Header ── */}
            <div className="p-5 pb-3 flex items-start gap-4">
              {/* Avatar */}
              <div className={`w-14 h-14 rounded-2xl ${avatarColor} flex items-center justify-center shrink-0 font-black text-xl`}>
                {student.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-[17px] leading-tight truncate">{student.full_name}</h2>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{student.email}</p>
                {student.phone && <p className="text-xs text-muted-foreground mt-0.5">{student.phone}</p>}
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                    {sc.label}
                  </span>
                  {hasOverdue && (
                    <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      Pag. atrasado
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-xl transition-colors -mr-1 -mt-1">
                <X className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>

            {/* ── Tab switcher ── */}
            <div className="mx-5 mb-4 p-1 bg-muted rounded-xl flex gap-1">
              {(["overview", "edit"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${
                    tab === t
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "overview" ? "Visão geral" : "Editar dados"}
                </button>
              ))}
            </div>

            {/* ═══ TAB: OVERVIEW ═══ */}
            {tab === "overview" && (
              <div className="space-y-3">
                {/* Quick Stats */}
                <div className="px-5 grid grid-cols-4 gap-2">
                  {[
                    { label: "Sessões",   value: String(stats?.total    ?? 0), icon: Calendar,      color: "text-primary",  bg: "bg-primary/10" },
                    { label: "Presença",  value: `${stats?.frequency   ?? 0}%`, icon: TrendingUp,    color: "text-success",  bg: "bg-success/10" },
                    { label: "Sequência", value: `${stats?.streak      ?? 0}d`, icon: Flame,         color: "text-warning",  bg: "bg-warning/10" },
                    { label: "Faltas",    value: String(stats?.missed   ?? 0), icon: AlertTriangle,  color: stats?.missed ? "text-destructive" : "text-success", bg: stats?.missed ? "bg-destructive/10" : "bg-success/10" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-2.5 text-center">
                      <div className={`w-6 h-6 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-1`}>
                        <stat.icon className={`h-3 w-3 ${stat.color}`} strokeWidth={1.8} />
                      </div>
                      <p className="font-black text-sm">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Fitness profile */}
                <div className="px-5">
                  {fitnessProfile ? (
                    <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="label-overline">Perfil Fitness</p>
                        <button onClick={() => setShowOnboarding(true)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: "Objetivo", value: objectiveLabels[fitnessProfile.objective] ?? fitnessProfile.objective },
                          { label: "Nível",    value: levelLabels[fitnessProfile.level]          ?? fitnessProfile.level },
                          { label: "Local",    value: locationLabels[fitnessProfile.training_location] ?? fitnessProfile.training_location },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-background rounded-xl p-2">
                            <p className="text-xs font-semibold leading-tight">{value}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      {fitnessProfile.notes && (
                        <p className="text-[11px] text-muted-foreground bg-background rounded-xl p-2 leading-relaxed">
                          {fitnessProfile.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setShowOnboarding(true)}
                      className="w-full bg-primary/5 border border-dashed border-primary/30 rounded-2xl p-4 text-center hover:bg-primary/10 transition-colors">
                      <Target className="h-5 w-5 text-primary mx-auto mb-1.5" />
                      <p className="text-sm font-bold text-primary">Configurar perfil fitness</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Defina objetivo, nível e local de treino</p>
                    </button>
                  )}
                </div>

                {/* Latest measurement */}
                {latestMeasurement && (
                  <div className="px-5">
                    <div className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="label-overline">Última Avaliação</p>
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(latestMeasurement.measured_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          latestMeasurement.weight_kg    != null && { label: "Peso",    value: `${Number(latestMeasurement.weight_kg).toFixed(1)}kg` },
                          latestMeasurement.body_fat_pct != null && { label: "Gordura", value: `${Number(latestMeasurement.body_fat_pct).toFixed(1)}%` },
                          latestMeasurement.waist_cm     != null && { label: "Cintura", value: `${Number(latestMeasurement.waist_cm).toFixed(0)}cm` },
                        ].filter(Boolean).map((it: any) => (
                          <div key={it.label} className="bg-muted/40 rounded-xl p-2">
                            <p className="font-black text-sm">{it.value}</p>
                            <p className="text-[9px] text-muted-foreground">{it.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active plans */}
                {activePlans.length > 0 && (
                  <div className="px-5">
                    <div className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        <p className="label-overline">Fichas Ativas</p>
                      </div>
                      <div className="space-y-1.5">
                        {activePlans.slice(0, 3).map((plan: any) => (
                          <div key={plan.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                            <p className="text-xs font-semibold">{plan.name}</p>
                            <span className="text-[10px] text-muted-foreground">{plan.workout_exercises?.length ?? 0} ex.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending payment */}
                {pendingPayment && (
                  <div className="px-5">
                    <div className={`rounded-2xl p-4 border ${hasOverdue ? "bg-destructive/5 border-destructive/20" : "bg-warning/5 border-warning/20"}`}>
                      <div className="flex items-center gap-2">
                        <DollarSign className={`h-4 w-4 ${hasOverdue ? "text-destructive" : "text-warning"}`} />
                        <p className="text-xs font-bold">
                          {hasOverdue ? "Pagamento atrasado" : "Pagamento pendente"}:
                          <strong className="ml-1">R$ {Number(pendingPayment.amount).toFixed(2)}</strong>
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 ml-6">
                        Vencimento: {format(parseISO(pendingPayment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Last activity */}
                {stats?.daysSinceLastSession != null && (
                  <div className="mx-5 p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-xs text-muted-foreground">
                        Última sessão:{" "}
                        <strong className="text-foreground">
                          {stats.daysSinceLastSession === 0 ? "Hoje" : `${stats.daysSinceLastSession} dia(s) atrás`}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="px-5 pb-2 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-11 rounded-xl gap-1.5 text-sm"
                    onClick={() => { onClose(); navigate("/messages"); }}>
                    <MessageSquare className="h-4 w-4" /> Mensagem
                  </Button>
                  <Button className="h-11 rounded-xl gap-1.5 text-sm"
                    onClick={() => { onClose(); navigate("/schedule"); }}>
                    <Calendar className="h-4 w-4" /> Agendar
                  </Button>
                  <Button variant="outline" className="h-11 rounded-xl gap-1.5 text-sm"
                    onClick={() => { onClose(); navigate("/workouts"); }}>
                    <Dumbbell className="h-4 w-4" /> Treinos
                  </Button>
                  <Button variant="outline" className="h-11 rounded-xl gap-1.5 text-sm"
                    onClick={() => { onClose(); navigate("/progress"); }}>
                    <TrendingUp className="h-4 w-4" /> Progresso
                  </Button>
                </div>
              </div>
            )}

            {/* ═══ TAB: EDIT ═══ */}
            {tab === "edit" && (
              <div className="px-5 pb-4 space-y-4">
                {/* Info notice for email */}
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
                  Alterações no nome, telefone e status são salvas diretamente. O e-mail só pode ser alterado pelo próprio aluno nas configurações dele.
                </div>

                {/* Nome */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Nome completo
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="Nome do aluno"
                  />
                </div>

                {/* Email — somente leitura */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email
                  </label>
                  <div className="relative">
                    <Input
                      value={student.email}
                      disabled
                      className="h-12 rounded-xl opacity-50 cursor-not-allowed pr-20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-lg">
                      só leitura
                    </span>
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Telefone / WhatsApp
                  </label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-12 rounded-xl"
                    placeholder="(11) 99999-0000"
                    type="tel"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["active", "at_risk", "inactive"] as const).map((s) => {
                      const cfg = statusConfig[s];
                      const sel = editStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setEditStatus(s)}
                          className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                            sel
                              ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-offset-1 ring-current`
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save */}
                <Button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="w-full h-12 rounded-xl text-base mt-2"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
                    : <><Save className="h-4 w-4 mr-2" />Salvar alterações</>
                  }
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showOnboarding && (
        <StudentOnboardingModal
          studentId={student.user_id}
          studentName={student.full_name}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
};

export default StudentDetailSheet;
