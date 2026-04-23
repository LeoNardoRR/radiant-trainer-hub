import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Student {
  user_id: string;
  full_name: string;
  email: string;
  status: 'active' | 'at_risk' | 'inactive';
  trainer_id?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export const useStudents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["students", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("trainer_id", user!.id)
        .order("full_name");
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!user,
  });
};

export const useStudentStats = (studentId?: string) => {
  return useQuery({
    queryKey: ["student-stats", studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("student_id", studentId)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      const total = sessions?.length || 0;
      const completed = sessions?.filter((s) => s.status === "completed").length || 0;
      const missed = sessions?.filter((s) => s.status === "missed").length || 0;
      const frequency = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate streak
      let streak = 0;
      const completedSessions = sessions?.filter((s) => s.status === "completed").sort((a, b) => b.date.localeCompare(a.date)) || [];
      for (const s of completedSessions) {
        const daysDiff = Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000);
        if (daysDiff <= streak + 2) streak++;
        else break;
      }

      const lastSession = sessions?.[0];
      const daysSinceLastSession = lastSession
        ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000)
        : null;

      return { total, completed, missed, frequency, streak, daysSinceLastSession, lastSession };
    },
    enabled: !!studentId,
  });
};
