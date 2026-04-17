import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { usePlan, type PlanFeature, FEATURE_LABELS } from "@/hooks/usePlan";
import UpgradeModal from "@/components/UpgradeModal";

interface PlanGateProps {
  feature: PlanFeature;
  children: ReactNode;
  /** Custom fallback — default: UpgradeWall */
  fallback?: ReactNode;
}

/** UpgradeWall shown inside the page when trainer doesn't have the feature */
const UpgradeWall = ({ feature }: { feature: PlanFeature }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Lock className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
          Plano Pro necessário
        </p>
        <h2 className="font-bold text-xl tracking-tight mb-2">
          {FEATURE_LABELS[feature]}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
          Este recurso está disponível nos planos{" "}
          <span className="font-semibold text-foreground">Pro</span> e{" "}
          <span className="font-semibold text-foreground">Business</span>.
          Faça upgrade para desbloquear.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="h-11 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors press-scale"
        >
          Ver planos
        </button>
      </motion.div>
      <UpgradeModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

/** Renders children if trainer has the feature; otherwise shows UpgradeWall */
const PlanGate = ({ feature, children, fallback }: PlanGateProps) => {
  const { canUse } = usePlan();

  if (canUse(feature)) return <>{children}</>;

  return fallback ? <>{fallback}</> : <UpgradeWall feature={feature} />;
};

export default PlanGate;
