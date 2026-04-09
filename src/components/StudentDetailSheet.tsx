import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, TrendingUp, AlertTriangle, Activity, Flame, Target, MapPin, Zap, Edit3 } from "lucide-react";
import { useStudentStats } from "@/hooks/useStudents";
import { useStudentFitnessProfile } from "@/hooks/useStudentFitnessProfile";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import StudentOnboardingModal from "@/components/StudentOnboardingModal";

interface StudentDetailSheetProps {
  student: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    status: string;
  } | null;
  onClose: () => void;
}

const statusConfig = {
  active: { label: "Ativo", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  inactive: { label: "Inativo", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  at_risk: { label: "Em risco", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
};

const objectiveLabels: Record<string, string> = {
  muscle_gain: "💪 Ganhar massa",
  weight_loss: "🔥 Emagrecer",
  conditioning: "🫀 Condicionamento",
  flexibility: "🧘 Flexibilidade",
  general: "✨ Saúde geral",
};

const levelLabels: Record<string, string> = {
  beginner: "🌱 Iniciante",
  intermediate: "⚡ Intermediário",
  advanced: "🏆 Avançado",
};

const locationLabels: Record<string, string> = {
  gym: "🏋️ Academia",
  home: "🏠 Casa",
  outdoor: "🌳 Ao ar livre",
  hybrid: "🔄 Híbrido",
};

const StudentDetailSheet = ({ student, onClose }: StudentDetailSheetProps) => {
  const { data: stats } = useStudentStats(student?.user_id);
  const { data: fitnessProfile } = useStudentFitnessProfile(student?.user_id);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  if (!student) return null;

  const sc = statusConfig[student.status as keyof typeof statusConfig] || statusConfig.active;
  const avatarColors = ["bg-primary/10 text-primary", "bg-success/10 text-success", "bg-warning/10 text-warning"];
  const colorIdx = student.full_name.charCodeAt(0) % avatarColors.length;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative bg-background border border-border w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {/* Header */}
            <div className="p-6 pb-4 flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl ${avatarColors[colorIdx]} flex items-center justify-center shrink-0`}>
                <span className="text-xl font-bold">{student.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg truncate">{student.full_name}</h2>
                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                {student.phone && <p className="text-xs text-muted-foreground mt-0.5">{student.phone}</p>}
                <span className={`inline-flex items-center gap-1 mt-2 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                  {sc.label}
                </span>
              </div>
              <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-xl transition-colors -mr-2 -mt-2">
                <X className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>

            {/* Fitness Profile */}
            <div className="px-6 pb-3">
              {fitnessProfile ? (
                <div className="bg-secondary/50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Perfil Fitness</p>
                    <button onClick={() => setShowOnboarding(true)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background rounded-xl p-2">
                      <p className="text-xs font-medium">{objectiveLabels[fitnessProfile.objective] || fitnessProfile.objective}</p>
                      <p className="text-[9px] text-muted-foreground">Objetivo</p>
                    </div>
                    <div className="bg-background rounded-xl p-2">
                      <p className="text-xs font-medium">{levelLabels[fitnessProfile.level] || fitnessProfile.level}</p>
                      <p className="text-[9px] text-muted-foreground">Nível</p>
                    </div>
                    <div className="bg-background rounded-xl p-2">
                      <p className="text-xs font-medium">{locationLabels[fitnessProfile.training_location] || fitnessProfile.training_location}</p>
                      <p className="text-[9px] text-muted-foreground">Local</p>
                    </div>
                  </div>
                  {fitnessProfile.notes && (
                    <p className="text-[11px] text-muted-foreground bg-background rounded-xl p-2">📝 {fitnessProfile.notes}</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full bg-primary/5 border border-dashed border-primary/30 rounded-2xl p-4 text-center hover:bg-primary/10 transition-colors"
                >
                  <Target className="h-5 w-5 text-primary mx-auto mb-1.5" />
                  <p className="text-sm font-semibold text-primary">Configurar perfil fitness</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Defina objetivo, nível e local de treino</p>
                </button>
              )}
            </div>

            {/* Stats Grid */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-2">
              {[
                { label: "Sessões (30d)", value: String(stats?.total || 0), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
                { label: "Frequência", value: `${stats?.frequency || 0}%`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
                { label: "Sequência", value: `${stats?.streak || 0} dias`, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
                { label: "Faltas", value: String(stats?.missed || 0), icon: AlertTriangle, color: stats?.missed ? "text-risk" : "text-success", bg: stats?.missed ? "bg-risk/10" : "bg-success/10" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} strokeWidth={1.8} />
                    </div>
                  </div>
                  <p className="font-bold text-lg">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Last activity */}
            {stats?.daysSinceLastSession !== null && stats?.daysSinceLastSession !== undefined && (
              <div className="mx-6 mb-4 p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs text-muted-foreground">
                    Última sessão: <strong className="text-foreground">{stats.daysSinceLastSession === 0 ? "Hoje" : `${stats.daysSinceLastSession} dia(s) atrás`}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pb-2 flex gap-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl"
                onClick={() => { onClose(); navigate("/messages"); }}>
                Mensagem
              </Button>
              <Button className="flex-1 h-12 rounded-xl"
                onClick={() => { onClose(); navigate("/schedule"); }}>
                Agendar
              </Button>
            </div>
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
