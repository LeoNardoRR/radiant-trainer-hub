import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpsertFitnessProfile } from "@/hooks/useStudentFitnessProfile";

interface StudentOnboardingModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

const objectives = [
  { value: "muscle_gain", label: "Ganhar massa", icon: "💪", desc: "Hipertrofia e força" },
  { value: "weight_loss", label: "Emagrecer", icon: "🔥", desc: "Perda de gordura" },
  { value: "conditioning", label: "Condicionamento", icon: "🫀", desc: "Resistência e saúde" },
  { value: "flexibility", label: "Flexibilidade", icon: "🧘", desc: "Mobilidade e bem-estar" },
  { value: "general", label: "Saúde geral", icon: "✨", desc: "Manutenção e equilíbrio" },
];

const levels = [
  { value: "beginner", label: "Iniciante", icon: "🌱", desc: "Até 6 meses de treino" },
  { value: "intermediate", label: "Intermediário", icon: "⚡", desc: "6 meses a 2 anos" },
  { value: "advanced", label: "Avançado", icon: "🏆", desc: "Mais de 2 anos" },
];

const locations = [
  { value: "gym", label: "Academia", icon: "🏋️" },
  { value: "home", label: "Casa", icon: "🏠" },
  { value: "outdoor", label: "Ao ar livre", icon: "🌳" },
  { value: "hybrid", label: "Híbrido", icon: "🔄" },
];

const StudentOnboardingModal = ({ studentId, studentName, onClose }: StudentOnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState("general");
  const [level, setLevel] = useState("beginner");
  const [location, setLocation] = useState("gym");
  const [notes, setNotes] = useState("");
  const upsert = useUpsertFitnessProfile();

  const handleSave = async () => {
    await upsert.mutateAsync({
      user_id: studentId,
      objective,
      level,
      training_location: location,
      notes: notes || undefined,
    });
    onClose();
  };

  const steps = [
    {
      title: "Objetivo",
      subtitle: `Qual o principal objetivo de ${studentName.split(" ")[0]}?`,
      icon: Target,
      content: (
        <div className="grid grid-cols-1 gap-2">
          {objectives.map((o) => (
            <button
              key={o.value}
              onClick={() => setObjective(o.value)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all min-h-[56px] ${
                objective === o.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/50 hover:bg-secondary text-foreground"
              }`}
            >
              <span className="text-2xl">{o.icon}</span>
              <div>
                <p className="text-sm font-semibold">{o.label}</p>
                <p className={`text-xs ${objective === o.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Nível",
      subtitle: "Qual o nível de experiência?",
      icon: Zap,
      content: (
        <div className="grid grid-cols-1 gap-2">
          {levels.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all min-h-[64px] ${
                level === l.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/50 hover:bg-secondary text-foreground"
              }`}
            >
              <span className="text-2xl">{l.icon}</span>
              <div>
                <p className="text-sm font-semibold">{l.label}</p>
                <p className={`text-xs ${level === l.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{l.desc}</p>
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Local",
      subtitle: "Onde vai treinar?",
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {locations.map((l) => (
              <button
                key={l.value}
                onClick={() => setLocation(l.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all min-h-[80px] ${
                  location === l.value
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/50 hover:bg-secondary text-foreground"
                }`}
              >
                <span className="text-2xl">{l.icon}</span>
                <p className="text-xs font-semibold">{l.label}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Observações (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lesões, restrições, preferências..."
              className="h-12 rounded-xl"
            />
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      >
        <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md mx-4 mb-0 sm:mb-0"
        >
          <div
            className="bg-background border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* Progress */}
            <div className="px-6 pt-5 pb-0 flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
                    }`}
                  />
                ))}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <current.icon className="h-4 w-4 text-primary" strokeWidth={2} />
                <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">{current.title}</p>
              </div>
              <h2 className="text-lg font-bold tracking-tight mb-4">{current.subtitle}</h2>
              {current.content}
            </div>

            {/* Actions */}
            <div className="px-6 pt-4 pb-2 flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="h-12 px-6 rounded-xl">
                  Voltar
                </Button>
              )}
              <Button
                onClick={isLast ? handleSave : () => setStep(step + 1)}
                disabled={upsert.isPending}
                className="flex-1 h-12 rounded-xl text-base"
              >
                {isLast ? (
                  upsert.isPending ? "Salvando..." : <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Salvar perfil</>
                ) : (
                  <>Próximo <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentOnboardingModal;
