import { useAuth } from "@/contexts/AuthContext";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { TrainerDashboard } from "@/components/dashboard/TrainerDashboard";
import { Loader2 } from "lucide-react";

const DashboardPage = () => {
  const { role, loading, signOut } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 text-primary animate-spin" />
      </div>
    );
  }
  
  if (!role) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground text-sm">Não foi possível carregar seu perfil. Isso pode ocorrer se sua conta ainda não foi completamente configurada.</p>
        <button onClick={signOut} className="btn-secondary">Voltar para o Login</button>
      </div>
    );
  }
  
  if (role === "student") {
    return <StudentDashboard />;
  }
  
  if (role === "trainer") {
    return <TrainerDashboard />;
  }

  return null;
};

export default DashboardPage;
