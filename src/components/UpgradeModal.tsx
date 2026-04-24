import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Zap, Crown, Building2 } from "lucide-react";
import { usePlan, PLAN_CONFIG } from "@/hooks/usePlan";
import { useAuth, type PlanTier } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TIER_ICONS = {
  starter: Zap,
  pro: Crown,
  business: Building2,
};

const ALL_FEATURES = [
  { key: "Agendamento e Agenda",       tiers: ["starter", "pro", "business"] },
  { key: "Chat com alunos",            tiers: ["starter", "pro", "business"] },
  { key: "Fichas de Treino",           tiers: ["starter", "pro", "business"] },
  { key: "Até 5 alunos",               tiers: ["starter"] },
  { key: "Alunos ilimitados",          tiers: ["pro", "business"] },
  { key: "Analytics avançado",         tiers: ["pro", "business"] },
  { key: "Gestão financeira",          tiers: ["pro", "business"] },
  { key: "Acompanhamento de progresso",tiers: ["pro", "business"] },
  { key: "Mensagens em massa",         tiers: ["pro", "business"] },
  { key: "Exportação de dados",        tiers: ["pro", "business"] },
  { key: "Suporte prioritário",        tiers: ["business"] },
  { key: "Múltiplas unidades",         tiers: ["business"] },
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const { tier: currentTier } = usePlan();
  const { user, profile } = useAuth();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [hoveredTier, setHoveredTier] = useState<PlanTier | null>(null);

  const handleUpgrade = async (tier: PlanTier) => {
    if (!user) return;
    setLoadingTier(tier);
    try {
      const { createCheckoutSession } = await import("@/services/stripe");
      const result = await createCheckoutSession({
        tier: tier as "pro" | "business",
        trainerId: user.id,
        email: profile?.email || user.email || "",
      });
      
      if (result.success) {
        toast.success("Assinatura confirmada com sucesso!");
        // Force reload to update context
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar checkout seguro.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:max-w-2xl bg-background border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                  UPGRADE
                </p>
                <h2 className="font-bold text-xl tracking-tight">Escolha seu plano</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Plan cards */}
            <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {(["starter", "pro", "business"] as PlanTier[]).map((tier) => {
                const cfg = PLAN_CONFIG[tier];
                const Icon = TIER_ICONS[tier];
                const isCurrent = tier === currentTier;
                const isHighlighted = tier === "pro";
                const isHovered = hoveredTier === tier;

                return (
                  <motion.div
                    key={tier}
                    onHoverStart={() => setHoveredTier(tier)}
                    onHoverEnd={() => setHoveredTier(null)}
                    animate={{ scale: isHovered && !isCurrent ? 1.02 : 1 }}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      isHighlighted
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-card border-border hover:border-primary/30"
                    } ${isCurrent ? "ring-2 ring-success ring-offset-2 ring-offset-background" : ""}`}
                    onClick={() => !isCurrent && tier !== "starter" && handleUpgrade(tier)}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-2.5 left-4">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-success text-white px-2.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2.5 right-4">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-success text-white px-2.5 py-0.5 rounded-full">
                          Atual
                        </span>
                      </div>
                    )}

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isHighlighted ? "bg-white/20" : "bg-primary/10"}`}>
                      <Icon className={`h-4 w-4 ${isHighlighted ? "text-white" : "text-primary"}`} />
                    </div>

                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {cfg.label}
                    </p>
                    <div className="flex items-baseline gap-0.5 mb-3">
                      <span className="font-black text-2xl">{cfg.price}</span>
                      <span className={`text-xs ${isHighlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {cfg.period}
                      </span>
                    </div>

                    {isCurrent ? (
                      <div className={`w-full h-9 rounded-xl flex items-center justify-center text-xs font-bold ${isHighlighted ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        Plano atual
                      </div>
                    ) : tier === "starter" ? (
                      <div className={`w-full h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground`}>
                        Plano gratuito
                      </div>
                    ) : (
                      <button
                        className={`w-full h-9 rounded-xl text-xs font-bold transition-all press-scale flex items-center justify-center gap-2 ${
                          isHighlighted
                            ? "bg-white text-primary hover:bg-white/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                        disabled={loadingTier === tier}
                      >
                        {loadingTier === tier ? (
                          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          "Assinar com Stripe / Asaas"
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Feature comparison */}
            <div className="px-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Comparativo de recursos
              </p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {ALL_FEATURES.map((feat, i) => (
                  <div
                    key={feat.key}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < ALL_FEATURES.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <span className="text-sm">{feat.key}</span>
                    <div className="flex items-center gap-3">
                      {(["starter", "pro", "business"] as PlanTier[]).map((tier) => (
                        <div key={tier} className="w-16 flex justify-center">
                          {feat.tiers.includes(tier) ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <span className="w-4 h-0.5 rounded bg-border block" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Header labels */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t border-border">
                  <span className="text-xs text-muted-foreground font-medium">Recurso</span>
                  <div className="flex items-center gap-3">
                    {(["starter", "pro", "business"] as PlanTier[]).map((tier) => (
                      <div key={tier} className="w-16 text-center">
                        <span className={`text-[10px] font-black uppercase ${PLAN_CONFIG[tier].color}`}>
                          {PLAN_CONFIG[tier].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
