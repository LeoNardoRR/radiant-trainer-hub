import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Plus, X, Ruler, Scale, Loader2, ChevronDown, ChevronUp, Users,
  BarChart3, Trash2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBodyMeasurements, useCreateBodyMeasurement, useDeleteBodyMeasurement, useWeightHistory } from "@/hooks/useProgress";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};

const measureFields = [
  { key: "weight_kg", label: "Peso (kg)", placeholder: "70.5" },
  { key: "height_cm", label: "Altura (cm)", placeholder: "175" },
  { key: "body_fat_pct", label: "% Gordura", placeholder: "15" },
  { key: "chest_cm", label: "Peitoral (cm)", placeholder: "95" },
  { key: "waist_cm", label: "Cintura (cm)", placeholder: "80" },
  { key: "hip_cm", label: "Quadril (cm)", placeholder: "95" },
  { key: "arm_cm", label: "Braço (cm)", placeholder: "35" },
  { key: "thigh_cm", label: "Coxa (cm)", placeholder: "55" },
  { key: "calf_cm", label: "Panturrilha (cm)", placeholder: "37" },
];

const ProgressPage = () => {
  const { role } = useAuth();
  const isTrainer = role === "trainer";

  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  const [showNewMeasure, setShowNewMeasure] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [newValues, setNewValues] = useState<Record<string, string>>({});

  const { data: students } = useStudents();
  const { data: measurements, isLoading } = useBodyMeasurements(selectedStudent);
  const { data: weightHistory } = useWeightHistory(selectedStudent);
  const createMeasurement = useCreateBodyMeasurement();
  const deleteMeasurement = useDeleteBodyMeasurement();

  const targetStudentId = isTrainer ? selectedStudent : undefined;

  const handleCreate = async () => {
    if (isTrainer && !selectedStudent) return;
    const payload: any = {
      student_id: selectedStudent || "",
      measured_at: newDate,
      notes: newNotes || undefined,
    };
    measureFields.forEach(({ key }) => {
      if (newValues[key]) payload[key] = Number(newValues[key]);
    });
    await createMeasurement.mutateAsync(payload);
    setShowNewMeasure(false);
    setNewValues({});
    setNewNotes("");
  };

  const latestMeasurement = measurements?.[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">RESULTADOS</p>
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Acompanhamento</h1>
          </div>
          {isTrainer && selectedStudent && (
            <Button onClick={() => setShowNewMeasure(true)} className="gap-2 rounded-xl h-11">
              <Plus className="h-4 w-4" /> Nova avaliação
            </Button>
          )}
        </motion.div>

        {/* Student selector (trainer only) */}
        {isTrainer && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selecionar aluno</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(students || []).map((s) => (
                <button key={s.user_id} onClick={() => setSelectedStudent(s.user_id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-[36px] ${selectedStudent === s.user_id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                  {s.full_name}
                </button>
              ))}
              {(!students || students.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum aluno vinculado.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Show prompt if trainer hasn't selected student */}
        {isTrainer && !selectedStudent ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-center py-16 bg-card border border-border rounded-2xl">
            <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-semibold">Selecione um aluno</p>
            <p className="text-sm text-muted-foreground mt-1">Escolha um aluno para ver o progresso.</p>
          </motion.div>
        ) : (
          <>
            {/* Weight chart */}
            {weightHistory && weightHistory.length > 1 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">EVOLUÇÃO DO PESO</p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weightHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => format(parseISO(v), "dd/MM", { locale: ptBR })} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                      formatter={(value: any) => [`${value} kg`, "Peso"]}
                      labelFormatter={(label) => format(parseISO(label), "dd/MM/yyyy", { locale: ptBR })}
                    />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Latest snapshot */}
            {latestMeasurement && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ÚLTIMA AVALIAÇÃO</p>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {format(parseISO(latestMeasurement.measured_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {measureFields.filter((f) => latestMeasurement[f.key] != null).map((f) => (
                    <div key={f.key} className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
                      <p className="text-lg font-black">{Number(latestMeasurement[f.key]).toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">{f.label.replace(" (cm)", "").replace(" (kg)", "").replace(" (%)", "")}</p>
                    </div>
                  ))}
                </div>
                {latestMeasurement.notes && (
                  <p className="text-xs text-muted-foreground mt-3 bg-muted/20 p-3 rounded-xl border border-border/50 italic">{latestMeasurement.notes}</p>
                )}
              </motion.div>
            )}

            {/* Measurement history */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" /> HISTÓRICO DE AVALIAÇÕES
                </p>
              </div>
              {isLoading ? (
                <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />)}</div>
              ) : !measurements || measurements.length === 0 ? (
                <div className="text-center py-10 bg-card border border-border rounded-2xl">
                  <Ruler className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-semibold">Nenhuma avaliação registrada</p>
                  {isTrainer && <p className="text-xs text-muted-foreground mt-1">Clique em "Nova avaliação" para registrar.</p>}
                </div>
              ) : (
                measurements.map((m: any) => {
                  const isOpen = expandedId === m.id;
                  return (
                    <div key={m.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : m.id)}>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Scale className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {format(parseISO(m.measured_at), "dd 'de' MMMM yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.weight_kg != null && `${m.weight_kg}kg`}
                            {m.body_fat_pct != null && ` · ${m.body_fat_pct}% gordura`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isTrainer && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm("Remover avaliação?")) deleteMeasurement.mutate(m.id); }}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-risk/10 rounded-xl transition-colors">
                              <Trash2 className="h-4 w-4 text-risk" />
                            </button>
                          )}
                          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }} className="overflow-hidden border-t border-border">
                            <div className="p-4">
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {measureFields.filter((f) => m[f.key] != null).map((f) => (
                                  <div key={f.key} className="bg-muted/30 rounded-xl p-2.5 text-center border border-border/50">
                                    <p className="text-base font-black">{Number(m[f.key]).toFixed(1)}</p>
                                    <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{f.label.replace(" (cm)", "").replace(" (kg)", "")}</p>
                                  </div>
                                ))}
                              </div>
                              {m.notes && <p className="text-xs text-muted-foreground mt-3 italic">{m.notes}</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* ── Modal: Nova Avaliação ───────────────────── */}
      <AnimatePresence>
        {showNewMeasure && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowNewMeasure(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-base">Nova Avaliação Física</p>
                <button onClick={() => setShowNewMeasure(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data da avaliação</label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {measureFields.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                      <Input type="number" step="0.1" value={newValues[key] || ""} onChange={(e) => setNewValues({ ...newValues, [key]: e.target.value })}
                        placeholder={placeholder} className="h-11 rounded-xl" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Observações</label>
                  <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Observações da avaliação..."
                    rows={2} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <Button onClick={handleCreate} disabled={createMeasurement.isPending} className="w-full h-12 rounded-xl">
                  {createMeasurement.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar avaliação
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default ProgressPage;
