import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, Plus, X, ChevronDown, ChevronUp, Search,
  Loader2, Pencil, Trash2, Users, BookOpen, ToggleLeft, ToggleRight, GripVertical,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useWorkoutPlans, useCreateWorkoutPlan, useUpdateWorkoutPlan, useDeleteWorkoutPlan,
  useExercises, useAddWorkoutExercise, useUpdateWorkoutExercise, useDeleteWorkoutExercise,
  useCreateExercise,
} from "@/hooks/useWorkouts";
import { useStudents } from "@/hooks/useStudents";

type ExerciseType = { id: string; name: string; muscle_group: string; description?: string; is_default?: boolean };
type WorkoutExerciseType = { id: string; exercise_name: string; sets: string | number; reps: string | number; load_kg?: number; rest_seconds: number; notes?: string; order_index: number };
type WorkoutPlanType = { id: string; name: string; is_active: boolean; student?: { full_name: string }; workout_exercises?: WorkoutExerciseType[] };

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

const muscleGroups = ["Peito", "Costas", "Pernas", "Glúteos", "Ombros", "Bíceps", "Tríceps", "Abdômen", "Panturrilha", "Cardio", "Funcional", "Geral"];

const WorkoutsPage = () => {
  const [tab, setTab] = useState<"plans" | "exercises">("plans");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("Todos");

  // New plan form
  const [newPlanStudent, setNewPlanStudent] = useState("");
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");

  // New exercise to add to plan
  const [addExSearch, setAddExSearch] = useState("");
  const [selectedExId, setSelectedExId] = useState("");
  const [exSets, setExSets] = useState("3");
  const [exReps, setExReps] = useState("12");
  const [exLoad, setExLoad] = useState("");
  const [exRest, setExRest] = useState("60");
  const [exNotes, setExNotes] = useState("");

  // New custom exercise form
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("Geral");
  const [newExDesc, setNewExDesc] = useState("");

  const { data: plans, isLoading } = useWorkoutPlans();
  const { data: exercises } = useExercises();
  const { data: students } = useStudents();

  const createPlan = useCreateWorkoutPlan();
  const updatePlan = useUpdateWorkoutPlan();
  const deletePlan = useDeleteWorkoutPlan();
  const addExercise = useAddWorkoutExercise();
  const updateExercise = useUpdateWorkoutExercise();
  const deleteExercise = useDeleteWorkoutExercise();
  const createExercise = useCreateExercise();

  const filteredExercises = (exercises || []).filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchMuscle = filterMuscle === "Todos" || ex.muscle_group === filterMuscle;
    return matchSearch && matchMuscle;
  });

  const addExFiltered = (exercises || []).filter((ex) =>
    ex.name.toLowerCase().includes(addExSearch.toLowerCase())
  );

  const handleCreatePlan = async () => {
    if (!newPlanStudent || !newPlanName.trim()) return;
    await createPlan.mutateAsync({ student_id: newPlanStudent, name: newPlanName, description: newPlanDesc || undefined });
    setShowNewPlan(false);
    setNewPlanStudent(""); setNewPlanName(""); setNewPlanDesc("");
  };

  const handleAddExercise = async () => {
    if (!showAddExercise) return;
    const selected = exercises?.find((e) => e.id === selectedExId);
    await addExercise.mutateAsync({
      workout_plan_id: showAddExercise,
      exercise_id: selectedExId || undefined,
      exercise_name: selected?.name || "Exercício",
      sets: Number(exSets) || 3,
      reps: exReps || "12",
      load_kg: exLoad ? Number(exLoad) : undefined,
      rest_seconds: Number(exRest) || 60,
      notes: exNotes || undefined,
      order_index: plans?.find((p: WorkoutPlanType) => p.id === showAddExercise)?.workout_exercises?.length || 0,
    });
    setShowAddExercise(null);
    setSelectedExId(""); setExSets("3"); setExReps("12"); setExLoad(""); setExRest("60"); setExNotes(""); setAddExSearch("");
  };

  const handleCreateExercise = async () => {
    if (!newExName.trim()) return;
    await createExercise.mutateAsync({ name: newExName, muscle_group: newExMuscle, description: newExDesc || undefined });
    setShowNewExercise(false);
    setNewExName(""); setNewExMuscle("Geral"); setNewExDesc("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">TREINOS</p>
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Prescrição de Treinos</h1>
          </div>
          <Button onClick={() => tab === "plans" ? setShowNewPlan(true) : setShowNewExercise(true)} className="gap-2 rounded-xl h-11">
            <Plus className="h-4 w-4" />
            {tab === "plans" ? "Nova ficha" : "Novo exercício"}
          </Button>
        </motion.div>

        {/* Tabs */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="flex gap-2">
          {[
            { key: "plans", label: "Fichas de Treino", icon: Dumbbell },
            { key: "exercises", label: "Biblioteca", icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === key ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:border-primary/30"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </motion.div>

        {/* ── TAB: Fichas ────────────────────────────────── */}
        {tab === "plans" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
            ) : !plans || plans.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Dumbbell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-sm">Nenhuma ficha criada</p>
                <p className="text-xs text-muted-foreground mt-1">Crie a primeira ficha de treino para um aluno.</p>
              </div>
            ) : (
              plans.map((plan: WorkoutPlanType, i: number) => {
                const isExpanded = expandedPlan === plan.id;
                const exercises = plan.workout_exercises || [];
                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-colors">
                    {/* Plan header */}
                    <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{plan.name}</p>
                          {!plan.is_active && <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold uppercase">Inativa</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">{plan.student?.full_name || "—"}</p>
                          <span className="text-muted-foreground/30">·</span>
                          <p className="text-xs text-muted-foreground">{exercises.length} exercício{exercises.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); updatePlan.mutate({ id: plan.id, is_active: !plan.is_active }); }}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-accent rounded-xl transition-colors" title="Ativar/Desativar">
                          {plan.is_active ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Remover esta ficha?")) deletePlan.mutate(plan.id); }}
                          className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-risk/10 rounded-xl transition-colors">
                          <Trash2 className="h-4 w-4 text-risk" />
                        </button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Exercises list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden border-t border-border">
                          <div className="p-4 space-y-2">
                            {exercises.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">Nenhum exercício adicionado ainda.</p>
                            ) : (
                              exercises
                                .slice()
                                .sort((a: WorkoutExerciseType, b: WorkoutExerciseType) => a.order_index - b.order_index)
                                .map((ex: WorkoutExerciseType, idx: number) => (
                                  <div key={ex.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-[10px] font-bold text-primary">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold">{ex.exercise_name}</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {[
                                          { label: "Séries", value: ex.sets },
                                          { label: "Reps", value: ex.reps },
                                          ex.load_kg != null && { label: "Carga", value: `${ex.load_kg}kg` },
                                          { label: "Descanso", value: `${ex.rest_seconds}s` },
                                        ].filter(Boolean).map((item: any) => (
                                          <span key={item.label} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-lg font-medium">
                                            <span className="text-muted-foreground">{item.label}: </span>{item.value}
                                          </span>
                                        ))}
                                      </div>
                                      {ex.notes && <p className="text-[11px] text-muted-foreground mt-1 italic">{ex.notes}</p>}
                                    </div>
                                    <button onClick={() => deleteExercise.mutate(ex.id)}
                                      className="p-1.5 hover:bg-risk/10 rounded-lg transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center">
                                      <X className="h-3.5 w-3.5 text-risk" />
                                    </button>
                                  </div>
                                ))
                            )}
                            <Button size="sm" variant="outline" onClick={() => { setShowAddExercise(plan.id); setExpandedPlan(plan.id); }}
                              className="w-full mt-2 rounded-xl border-dashed h-9 text-xs gap-1.5">
                              <Plus className="h-3.5 w-3.5" /> Adicionar exercício
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── TAB: Biblioteca de Exercícios ──────────────── */}
        {tab === "exercises" && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Buscar exercício..."
                className="pl-10 h-12 rounded-xl"
              />
            </div>

            {/* Muscle filter chips — flex wrap (sem corte) */}
            <div className="flex flex-wrap gap-1.5">
              {["Todos", ...muscleGroups].map((m) => (
                <button key={m} onClick={() => setFilterMuscle(m)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all min-h-[36px] ${
                    filterMuscle === m
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  {m}
                </button>
              ))}
            </div>

            {/* Exercise list — grouped vertically */}
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhum exercício encontrado.
              </div>
            ) : filterMuscle !== "Todos" ? (
              /* Single group — just a flat list */
              <div className="space-y-2">
                {filteredExercises.map((ex: ExerciseType, i: number) => (
                  <motion.div key={ex.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-primary/20 transition-colors min-h-[56px]">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-primary">{ex.muscle_group?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{ex.name}</p>
                      {ex.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">{ex.description}</p>
                      )}
                    </div>
                    {ex.is_default && (
                      <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold shrink-0">Padrão</span>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              /* All groups — sectioned by muscle group */
              (() => {
                const grouped = muscleGroups.reduce((acc: Record<string, ExerciseType[]>, mg) => {
                  const items = filteredExercises.filter((ex: ExerciseType) => ex.muscle_group === mg);
                  if (items.length > 0) acc[mg] = items;
                  return acc;
                }, {});

                return (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([group, items]) => (
                      <div key={group}>
                        <p className="label-overline mb-2">{group}</p>
                        <div className="space-y-1.5">
                          {items.map((ex: ExerciseType, i: number) => (
                            <motion.div key={ex.id}
                              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-3 hover:border-primary/20 transition-colors min-h-[52px]">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{ex.name}</p>
                                {ex.description && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 leading-tight">{ex.description}</p>
                                )}
                              </div>
                              {ex.is_default && (
                                <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold shrink-0">Padrão</span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modal: Nova Ficha ─────────────────────────── */}
      <AnimatePresence>
        {showNewPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setShowNewPlan(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-2xl w-full sm:max-w-md shadow-2xl overflow-y-auto"
              style={{ 
                maxHeight: '82dvh', 
                paddingBottom: '100px',
                overscrollBehavior: 'contain'
              }}
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-bold text-base">Nova Ficha de Treino</p>
                  <button onClick={() => setShowNewPlan(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Aluno</label>
                    <select value={newPlanStudent} onChange={(e) => setNewPlanStudent(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecione um aluno...</option>
                      {(students || []).map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome da ficha</label>
                    <Input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Ex: Treino A — Peito e Tríceps" className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição (opcional)</label>
                    <Input value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} placeholder="Observações gerais..." className="h-12 rounded-xl" />
                  </div>
                  <Button onClick={handleCreatePlan} disabled={!newPlanStudent || !newPlanName.trim() || createPlan.isPending} className="w-full h-12 rounded-xl">
                    {createPlan.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar ficha
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Adicionar Exercício à Ficha ─────────── */}
      <AnimatePresence>
        {showAddExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setShowAddExercise(null)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-2xl p-6 w-full sm:max-w-md shadow-2xl overflow-y-auto"
              style={{ 
                maxHeight: '82dvh',
                paddingBottom: '100px',
                overscrollBehavior: 'contain'
              }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-base">Adicionar Exercício</p>
                <button onClick={() => setShowAddExercise(null)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Exercício</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={addExSearch} onChange={(e) => setAddExSearch(e.target.value)} placeholder="Buscar..." className="pl-10 h-10 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto">
                    {addExFiltered.map((ex: ExerciseType) => (
                      <button key={ex.id} onClick={() => setSelectedExId(ex.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all ${selectedExId === ex.id ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-accent"}`}>
                        <span className="flex-1 truncate font-medium">{ex.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${selectedExId === ex.id ? "bg-white/20" : "bg-primary/10 text-primary"}`}>{ex.muscle_group}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Séries", value: exSets, set: setExSets, placeholder: "3" },
                    { label: "Reps", value: exReps, set: setExReps, placeholder: "12" },
                    { label: "Carga (kg)", value: exLoad, set: setExLoad, placeholder: "0" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                      <Input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} className="h-10 rounded-xl text-center" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descanso (segundos)</label>
                  <Input value={exRest} onChange={(e) => setExRest(e.target.value)} placeholder="60" className="h-10 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Observações técnicas</label>
                  <Input value={exNotes} onChange={(e) => setExNotes(e.target.value)} placeholder="Dica de execução..." className="h-10 rounded-xl" />
                </div>
                <Button onClick={handleAddExercise} disabled={!selectedExId || addExercise.isPending} className="w-full h-12 rounded-xl">
                  {addExercise.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Adicionar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Novo Exercício (biblioteca) ───────────── */}
      <AnimatePresence>
        {showNewExercise && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowNewExercise(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between mb-5">
                  <p className="font-bold text-base">Novo Exercício</p>
                  <button onClick={() => setShowNewExercise(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
                    <Input value={newExName} onChange={(e) => setNewExName(e.target.value)} placeholder="Nome do exercício" className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Grupo muscular</label>
                    <select value={newExMuscle} onChange={(e) => setNewExMuscle(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      {muscleGroups.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descrição</label>
                    <Input value={newExDesc} onChange={(e) => setNewExDesc(e.target.value)} placeholder="Breve descrição..." className="h-12 rounded-xl" />
                  </div>
                  <Button onClick={handleCreateExercise} disabled={!newExName.trim() || createExercise.isPending} className="w-full h-12 rounded-xl">
                    {createExercise.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar exercício
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default WorkoutsPage;
