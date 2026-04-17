import { useAuth } from "@/contexts/AuthContext";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { TrainerDashboard } from "@/components/dashboard/TrainerDashboard";

const DashboardPage = () => {
  const { role } = useAuth();
  
  if (role === "student") {
    return <StudentDashboard />;
  }
  
  if (role === "trainer") {
    return <TrainerDashboard />;
  }

  return null;
};

export default DashboardPage;
