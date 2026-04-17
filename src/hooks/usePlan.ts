import { useAuth } from "@/contexts/AuthContext";
import type { PlanTier } from "@/contexts/AuthContext";

export type PlanFeature =
  | "analytics"
  | "financial"
  | "progress"
  | "bulk_message"
  | "export_data";

// ── Tier definitions ────────────────────────────────────────────
export const PLAN_CONFIG: Record<
  PlanTier,
  {
    label: string;
    price: string;
    period: string;
    maxStudents: number;
    color: string;
    badge: string;
    features: PlanFeature[];
    description: string;
  }
> = {
  starter: {
    label: "Starter",
    price: "Grátis",
    period: "",
    maxStudents: 5,
    color: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    features: [],
    description: "Ideal para começar",
  },
  pro: {
    label: "Pro",
    price: "R$4,90",
    period: "/mês",
    maxStudents: Infinity,
    color: "text-primary",
    badge: "bg-primary/10 text-primary",
    features: ["analytics", "financial", "progress", "bulk_message", "export_data"],
    description: "Para profissionais ativos",
  },
  business: {
    label: "Business",
    price: "R$7,90",
    period: "/mês",
    maxStudents: Infinity,
    color: "text-violet-600",
    badge: "bg-violet-500/10 text-violet-600",
    features: ["analytics", "financial", "progress", "bulk_message", "export_data"],
    description: "Múltiplas unidades e suporte dedicado",
  },
};

const TIER_RANK: Record<PlanTier, number> = {
  starter: 0,
  pro: 1,
  business: 2,
};

// ── Main hook ───────────────────────────────────────────────────
export const usePlan = () => {
  const { planTier } = useAuth();
  const tier = planTier ?? "starter";
  const config = PLAN_CONFIG[tier];

  const canUse = (feature: PlanFeature): boolean => {
    return config.features.includes(feature);
  };

  const isAtLeast = (minTier: PlanTier): boolean => {
    return TIER_RANK[tier] >= TIER_RANK[minTier];
  };

  return {
    tier,
    config,
    isPro: isAtLeast("pro"),
    isBusiness: tier === "business",
    isStarter: tier === "starter",
    canUse,
    isAtLeast,
    maxStudents: config.maxStudents,
  };
};

// ── Feature display names ────────────────────────────────────────
export const FEATURE_LABELS: Record<PlanFeature, string> = {
  analytics: "Analytics avançado",
  financial: "Gestão financeira",
  progress: "Progresso e medidas",
  bulk_message: "Mensagens em massa",
  export_data: "Exportação de dados",
};
