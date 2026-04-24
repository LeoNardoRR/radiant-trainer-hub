import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"] | "admin";

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
}

/**
 * Componente para esconder ou mostrar elementos da UI baseado na Role do usuário.
 * Exemplo: <RoleGate allowedRoles={["trainer"]}><BotaoDeletar /></RoleGate>
 */
export const RoleGate = ({ children, allowedRoles, fallback = null }: RoleGateProps) => {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role as AppRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
