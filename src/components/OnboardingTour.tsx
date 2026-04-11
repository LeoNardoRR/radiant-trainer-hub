import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, Bell, BarChart3, MessageSquare, Settings,
  ChevronRight, Sparkles, ArrowRight, Dumbbell, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const trainerSteps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao AppFit! 🎉",
    subtitle: "Seu assistente inteligente para gerenciar alunos",
    description: "Vamos fazer um tour rápido pelas funcionalidades principais. Vai levar menos de 1 minuto!",
    color: "from-primary to-[hsl(168,80%,28%)]",
    bg: "bg-primary/10",
    illustration: "🏋️‍♂️",
  },
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    subtitle: "Controle total da sua semana",
    description: "Visualize sua agenda semanal, aprove ou recuse solicitações de alunos e evite conflitos de horários automaticamente.",
    color: "from-primary to-success",
    bg: "bg-primary/10",
    illustration: "📅",
  },
  {
    icon: Users,
    title: "Gestão de Alunos",
    subtitle: "Acompanhe cada aluno de perto",
    description: "Veja o status de cada aluno, identifique quem está em risco de desistência e tome ações antes que seja tarde.",
    color: "from-[hsl(230,70%,55%)] to-primary",
    bg: "bg-[hsl(230,70%,55%,0.1)]",
    illustration: "👥",
  },
  {
    icon: Bell,
    title: "Notificações de Retenção",
    subtitle: "Nunca perca um aluno",
    description: "Alertas inteligentes com 3 níveis (leve, moderado, crítico) quando um aluno começa a faltar. Configure os prazos como preferir.",
    color: "from-warning to-[hsl(25,90%,50%)]",
    bg: "bg-warning/10",
    illustration: "🔔",
  },
  {
    icon: Settings,
    title: "Convide seus Alunos",
    subtitle: "Sistema de convite simples",
    description: "Gere códigos de convite em Configurações e compartilhe com seus alunos. Eles se vinculam a você automaticamente!",
    color: "from-success to-primary",
    bg: "bg-success/10",
    illustration: "🎫",
  },
];

const studentSteps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao AppFit! 🎉",
    subtitle: "Seu app de agendamento de treinos",
    description: "Agende sessões com seu personal trainer de forma rápida e fácil. Vamos te mostrar como!",
    color: "from-[hsl(230,70%,55%)] to-[hsl(250,70%,55%)]",
    bg: "bg-[hsl(230,70%,55%,0.1)]",
    illustration: "💪",
  },
  {
    icon: Settings,
    title: "Vincule-se ao seu Personal",
    subtitle: "Primeiro passo importante",
    description: "Vá em Configurações e insira o código de convite que seu personal compartilhou. Isso te conecta à agenda dele.",
    color: "from-primary to-success",
    bg: "bg-primary/10",
    illustration: "🔗",
  },
  {
    icon: Calendar,
    title: "Agende seus Treinos",
    subtitle: "Simples e rápido",
    description: "Toque em um horário livre na agenda para solicitar uma sessão. Seu personal irá aprovar e você recebe uma notificação!",
    color: "from-[hsl(230,70%,55%)] to-primary",
    bg: "bg-[hsl(230,70%,55%,0.1)]",
    illustration: "📅",
  },
  {
    icon: MessageSquare,
    title: "Fale com seu Personal",
    subtitle: "Tudo pelo app",
    description: "Use as Mensagens para se comunicar diretamente. Sem precisar de WhatsApp!",
    color: "from-success to-[hsl(168,80%,28%)]",
    bg: "bg-success/10",
    illustration: "💬",
  },
];

const ONBOARDING_KEY = "appfit-onboarding-completed";

const OnboardingTour = () => {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const { role, user } = useAuth();

  useEffect(() => {
    if (!user || !role) return;
    const key = `${ONBOARDING_KEY}-${user.id}`;
    const completed = localStorage.getItem(key);
    if (completed) return; // Already completed — never show again
    // Mark as completed immediately to prevent re-showing
    localStorage.setItem(key, "true");
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, [user, role]);

  const steps = role === "trainer" ? trainerSteps : studentSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleComplete = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}-${user.id}`, "true");
    }
    setShow(false);
  };

  if (!show || !current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={handleComplete} />

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-sm mx-4 mb-0 sm:mb-0"
        >
          <div className="bg-background border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            
            {/* Header gradient */}
            <div className={`bg-gradient-to-br ${current.color} p-6 pb-10 relative overflow-hidden`}>
              <div className="absolute top-3 right-3 flex gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-white" : i < step ? "w-2 bg-white/60" : "w-2 bg-white/25"
                  }`} />
                ))}
              </div>
              
              <div className="text-6xl mb-3 mt-2">{current.illustration}</div>
              <p className="text-white/70 text-[10px] font-display uppercase tracking-[0.2em] font-medium mb-1">
                Passo {step + 1} de {steps.length}
              </p>
            </div>

            {/* Content */}
            <div className="px-6 -mt-4">
              <div className="bg-background border border-border rounded-2xl p-5 shadow-lg">
                <h2 className="font-display font-bold text-xl tracking-tight mb-1">{current.title}</h2>
                <p className="text-sm text-primary font-display font-medium mb-3">{current.subtitle}</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{current.description}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pt-5 pb-2 flex gap-3">
              <button onClick={handleComplete}
                className="flex-shrink-0 px-4 py-3 text-sm font-body text-muted-foreground hover:text-foreground transition-colors min-h-[48px] rounded-xl">
                Pular
              </button>
              <button onClick={handleNext}
                className={`flex-1 bg-gradient-to-r ${current.color} text-white py-3 px-6 rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.97] transition-transform shadow-lg`}>
                {isLast ? (
                  <><CheckCircle2 className="h-4 w-4" /> Começar!</>
                ) : (
                  <>Próximo <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
