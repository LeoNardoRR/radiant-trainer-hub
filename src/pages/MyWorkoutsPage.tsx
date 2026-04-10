import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, ChevronDown, ChevronUp, CheckCircle2, X, Loader2,
  Flame, Clock, Zap, Heart, Moon, Battery,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useStudentWorkoutPlans, useLogWorkoutExecution, useWorkoutExecutions } from "@/hooks/useWorkouts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

const feedbackLabels: Record<string, string[]> = {
  energy: ["Sem energia", "Cansado", "Normal", "Bem disposto", "Energizado!"],
  pain: ["Sem dor", "Leve", "Moderada", "Intensa", "Muito forte"],
  sleep: ["Péssimo", "Ruim", "Regular", "Bom", "Ótimo!"],
};

const MyWorkoutsPage = () => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [energy, setEnergy] = useState(3);
  const [pain, setPain] = useState(1);
  const [sleep, setSleep] = useState(3);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState("");

  const { data: plans, isLoading } = useStudentWorkoutPlans();
  const { data: executions } = useWorkoutExecutions();
  const logExecution = useLogWorkoutExecution();

  const handleSubmitFeedback = async () => {
    if (!showFeedback) return;
    await logExecution.mutateAsync({
      workout_plan_id: showFeedback,
      feedback_energy: energy,
      feedback_muscle_pain: pain,
      feedback_sleep_quality: sleep,
      feedback_notes: notes || undefined,
      duration_minutes: duration ? Number(duration) : undefined,
    });
    setShowFeedback(null);
    setEnergy(3); setPain(1); setSleep(3); setNotes(""); setDuration("");
  };

  const lastExecution = (planId: string) =>
    executions?.find((e: any) => e.workout_plan_id === planId);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">MEUS TREINOS</p>
          <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Fichas de Treino</h1>
          <p className="text-sm text-muted-foreground mt-1">Suas fichas prescritas pelo personal.</p>
        </motion.div>

        {/* Plans */}
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
        ) : !plans || plans.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-center py-16 bg-card border border-border rounded-2xl">
            <Dumbbell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-semibold">Nenhuma ficha disponível</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Seu personal ainda não criou uma ficha de treino para você.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan: any, i: number) => {
              const isExpanded = expandedPlan === plan.id;
              const exercises = (plan.workout_exercises || []).slice().sort((a: any, b: any) => a.order_index - b.order_index);
              const lastEx = lastExecution(plan.id);

              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{plan.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">{exercises.length} exercício{exercises.length !== 1 ? "s" : ""}</p>
                        {lastEx && (
                          <p className="text-[10px] text-muted-foreground">
                            · Último: {format(new Date(lastEx.completed_at), "dd/MM", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowFeedback(plan.id); }}
                        className="h-9 px-3 rounded-xl text-xs gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Exercises — vertical list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="p-4 space-y-2">
                          {plan.description && (
                            <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50 mb-3 leading-relaxed">
                              {plan.description}
                            </p>
                          )}
                          {exercises.map((ex: any, idx: number) => (
                            <div key={ex.id}
                              className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/40 hover:border-primary/20 transition-colors min-h-[56px]">
                              {/* Index */}
                              <div className="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
                                <span className="text-[11px] font-black text-primary">{idx + 1}</span>
                              </div>
                              {/* Name + notes */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-tight">{ex.exercise_name}</p>
                                {ex.technical_notes && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{ex.technical_notes}</p>
                                )}
                              </div>
                              {/* Compact stats — vertical, right aligned */}
                              <div className="shrink-0 text-right space-y-0.5">
                                <p className="text-xs font-bold text-foreground">
                                  {ex.sets}×{ex.reps ?? "—"}
                                </p>
                                {ex.weight_kg != null && (
                                  <p className="text-[11px] text-muted-foreground">{ex.weight_kg} kg</p>
                                )}
                                {ex.rest_seconds && (
                                  <p className="text-[10px] text-muted-foreground">{ex.rest_seconds}s rest</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Recent executions */}
        {executions && executions.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4 text-warning" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HISTÓRICO RECENTE</p>
            </div>
            <div className="space-y-2">
              {executions.slice(0, 5).map((ex: any) => (
                <div key={ex.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-b-0">
                  <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Treino concluído</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(ex.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {ex.duration_minutes && ` · ${ex.duration_minutes}min`}
                    </p>
                  </div>
                  {ex.feedback_energy && (
                    <div className="flex gap-1">
                      {[
                        { icon: Zap, value: ex.feedback_energy, color: "text-yellow-500" },
                        { icon: Battery, value: ex.feedback_muscle_pain, color: "text-orange-500" },
                        { icon: Moon, value: ex.feedback_sleep_quality, color: "text-blue-500" },
                      ].map(({ icon: Icon, value, color }, k) => value ? (
                        <span key={k} className={`text-[10px] font-bold ${color} flex items-center gap-0.5`}>
                          <Icon className="h-3 w-3" />{value}
                        </span>
                      ) : null)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Modal: Feedback pós-treino ──────────────── */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowFeedback(null)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-base">Treino Concluído! 💪</p>
                <button onClick={() => setShowFeedback(null)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Registre como você se sentiu no treino de hoje.</p>

              <div className="space-y-5">
                {/* Duration */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Duração (minutos)
                  </label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 45"
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                {/* Feedback scales */}
                {[
                  { key: "energy", label: "Nível de energia", icon: Zap, color: "text-yellow-500", state: energy, setState: setEnergy },
                  { key: "pain", label: "Dor muscular", icon: Heart, color: "text-orange-500", state: pain, setState: setPain },
                  { key: "sleep", label: "Qualidade do sono", icon: Moon, color: "text-blue-500", state: sleep, setState: setSleep },
                ].map(({ key, label, icon: Icon, color, state, setState }) => (
                  <div key={key}>
                    <label className={`text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
                      <span className="ml-auto font-semibold text-foreground">{feedbackLabels[key][state - 1]}</span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} onClick={() => setState(v)}
                          className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${state === v ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Observações (opcional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Como foi o treino?"
                    rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>

                <Button onClick={handleSubmitFeedback} disabled={logExecution.isPending} className="w-full h-12 rounded-xl text-base">
                  {logExecution.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Registrar treino ✓
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default MyWorkoutsPage;
