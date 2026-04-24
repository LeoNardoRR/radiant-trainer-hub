import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Plus, X, Ruler, Scale, Loader2, ChevronDown, ChevronUp, Users,
  BarChart3, Trash2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlanGate from "@/components/PlanGate";
import PaymentRequiredWall from "@/components/PaymentRequiredWall";
import { useBodyMeasurements, useCreateBodyMeasurement, useDeleteBodyMeasurement, useWeightHistory } from "@/hooks/useProgress";
import { useUserStreak, useUserBadges } from "@/hooks/useGamification";
import { useStudents } from "@/hooks/useStudents";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentAccess } from "@/hooks/useStudentAccess";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProgressPhotos, useCreateProgressPhoto, useDeleteProgressPhoto } from "@/hooks/useProgressPhotos";
import { PhotoComparison } from "@/components/PhotoComparison";
import { Camera, Image as ImageIcon } from "lucide-react";
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
  const { isOverdue } = useStudentAccess();

  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(undefined);
  const [showNewMeasure, setShowNewMeasure] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"measures" | "photos">("measures");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoType, setPhotoType] = useState<"front" | "side" | "back" | "other">("other");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: students } = useStudents();
  const { data: measurements, isLoading } = useBodyMeasurements(selectedStudent);
  const { data: weightHistory } = useWeightHistory(selectedStudent);
  const { data: photos, isLoading: photosLoading } = useProgressPhotos(selectedStudent);
  
  const createMeasurement = useCreateBodyMeasurement();
  const deleteMeasurement = useDeleteBodyMeasurement();
  const createPhoto = useCreateProgressPhoto();
  const deletePhoto = useDeleteProgressPhoto();

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

  const handlePhotoUpload = async () => {
    if (!photoPreview || !selectedStudent) return;
    
    // In a real app, you'd upload to Supabase Storage first
    // For now, let's assume we have a URL or use a placeholder
    const mockUrl = photoPreview; // Normally would be the returned URL from storage

    await createPhoto.mutateAsync({
      student_id: selectedStudent,
      photo_url: mockUrl,
      type: photoType,
      captured_at: newDate,
      notes: newNotes || undefined,
    });
    
    setShowPhotoUpload(false);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const onPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const latestMeasurement = measurements?.[0];

  return (
    <AppLayout>
      {/* Trainer gate — Pro required */}
      {isTrainer ? (
        <PlanGate feature="progress">
          <div className="space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">RESULTADOS</p>
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Acompanhamento</h1>
          </div>
          {isTrainer && selectedStudent && (
            <div className="flex gap-2">
              <Button onClick={() => activeTab === "measures" ? setShowNewMeasure(true) : setShowPhotoUpload(true)} className="gap-2 rounded-xl h-11">
                <Plus className="h-4 w-4" /> Nova {activeTab === "measures" ? "avaliação" : "foto"}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Tab Switcher */}
        {selectedStudent && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5} className="flex p-1 bg-muted rounded-2xl w-full sm:w-fit">
            <button 
              onClick={() => setActiveTab("measures")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "measures" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Medidas
            </button>
            <button 
              onClick={() => setActiveTab("photos")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "photos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Fotos
            </button>
          </motion.div>
        )}

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
        ) : activeTab === "measures" ? (
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
        ) : (
          <div className="space-y-6">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
              <PhotoComparison photos={photos || []} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Galeria de Fotos</p>
              {photos?.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <Camera className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-semibold">Nenhuma foto registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">Registre fotos para acompanhar a mudança visual.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos?.map((photo) => (
                    <div key={photo.id} className="relative group aspect-[3/4] bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                      <img src={photo.photo_url} className="w-full h-full object-cover" alt="Evolução" />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent pt-8">
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                          {format(parseISO(photo.captured_at), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-[9px] text-white/70 font-bold uppercase">{photo.type}</p>
                      </div>
                      {isTrainer && (
                        <button 
                          onClick={() => confirm("Excluir foto?") && deletePhoto.mutate({ id: photo.id, studentId: selectedStudent! })}
                          className="absolute top-2 right-2 p-1.5 bg-risk text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Modal: Nova Foto ───────────────────── */}
      <AnimatePresence>
        {showPhotoUpload && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowPhotoUpload(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-base">Adicionar Foto</p>
                <button onClick={() => setShowPhotoUpload(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <label className="w-full aspect-square max-w-[240px] border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20 overflow-hidden relative">
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs font-bold text-muted-foreground">Clique para selecionar</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={onPhotoSelect} />
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo</label>
                    <select 
                      value={photoType} 
                      onChange={(e) => setPhotoType(e.target.value as any)}
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="front">Frente</option>
                      <option value="side">Lado</option>
                      <option value="back">Costas</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data</label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notas (opcional)</label>
                  <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Ex: Pós-treino, em jejum..."
                    rows={2} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>

                <Button onClick={handlePhotoUpload} disabled={!photoPreview || createPhoto.isPending} className="w-full h-12 rounded-xl">
                  {createPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                  Salvar Foto
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Nova Avaliação ───────────────────── */}
      <AnimatePresence>
        {showNewMeasure && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowNewMeasure(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-lg shadow-2xl max-h-[92dvh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
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
        </PlanGate>
      ) : isOverdue ? (
        /* Student gate — overdue payment */
        <PaymentRequiredWall feature="acompanhamento de progresso" />
      ) : (
        /* Student with active payment — show progress info */
        <div className="space-y-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GAMIFICAÇÃO & RESULTADOS</p>
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight">Meu Progresso</h1>
          </motion.div>
          
          <StudentGamificationView />

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="text-center py-16 bg-card border border-border rounded-2xl">
            <TrendingUp className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-semibold">Avaliações Físicas</p>
            <p className="text-sm text-muted-foreground mt-1">Suas avaliações físicas aparecem aqui quando o personal registrá-las.</p>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
};

const StudentGamificationView = () => {
  const { data: streak } = useUserStreak();
  const { data: userBadges } = useUserBadges();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="text-2xl font-black">{streak?.current_streak || 0}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Dias Seguidos</p>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.2} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl">💪</span>
          </div>
          <div>
            <p className="text-2xl font-black">{streak?.total_workouts || 0}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Treinos Feitos</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">MINHAS CONQUISTAS</p>
          <span className="text-xs font-semibold bg-secondary px-2.5 py-1 rounded-full">{userBadges?.length || 0} medalhas</span>
        </div>
        
        {!userBadges || userBadges.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
              <span className="text-xl">🏆</span>
            </div>
            <p className="text-sm font-semibold">Nenhuma conquista ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Complete treinos para desbloquear medalhas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {userBadges.map((ub: any) => (
              <div key={ub.id} className="bg-muted/30 border border-border/50 rounded-xl p-3 text-center flex flex-col items-center">
                <span className="text-3xl mb-2 filter drop-shadow-sm">{ub.badge?.icon || "🏆"}</span>
                <p className="text-xs font-bold leading-tight">{ub.badge?.name}</p>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{ub.badge?.description}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProgressPage;
