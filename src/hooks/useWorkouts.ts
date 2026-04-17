import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Exercises (biblioteca) ───────────────────────────────────
export const useExercises = () => {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises" as any)
        .select("*")
        .order("muscle_group")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreateExercise = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ex: { name: string; muscle_group: string; description?: string }) => {
      const { data, error } = await supabase
        .from("exercises" as any)
        .insert({ ...ex, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Exercício criado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ─── Workout Plans ─────────────────────────────────────────────
export const useWorkoutPlans = (studentId?: string) => {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["workout-plans", user?.id, studentId],
    queryFn: async () => {
      let query = supabase
        .from("workout_plans" as any)
        .select("*, workout_exercises(*)")
        .order("created_at", { ascending: false });

      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with student profile info
      const studentIds = [...new Set((data as any[]).map((p: any) => p.student_id))];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", studentIds);
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        return (data as any[]).map((plan: any) => ({
          ...plan,
          student: profileMap.get(plan.student_id) || null,
        }));
      }
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useStudentWorkoutPlans = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-workout-plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_plans" as any)
        .select("*, workout_exercises(*)")
        .eq("student_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useCreateWorkoutPlan = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (plan: { student_id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from("workout_plans" as any)
        .insert({ ...plan, trainer_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
      toast.success("Ficha de treino criada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateWorkoutPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from("workout_plans" as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
      qc.invalidateQueries({ queryKey: ["my-workout-plans"] });
      toast.success("Ficha atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteWorkoutPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workout_plans" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
      toast.success("Ficha removida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ─── Workout Exercises ─────────────────────────────────────────
export const useAddWorkoutExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: {
      workout_plan_id: string;
      exercise_name: string;
      exercise_id?: string;
      sets?: number;
      reps?: string;
      load_kg?: number;
      rest_seconds?: number;
      notes?: string;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from("workout_exercises" as any)
        .insert(exercise)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
      qc.invalidateQueries({ queryKey: ["my-workout-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateWorkoutExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; sets?: number; reps?: string; load_kg?: number; rest_seconds?: number; notes?: string }) => {
      const { error } = await supabase
        .from("workout_exercises" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
      qc.invalidateQueries({ queryKey: ["my-workout-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteWorkoutExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workout_exercises" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-plans"] });
      qc.invalidateQueries({ queryKey: ["my-workout-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ─── Workout Executions ────────────────────────────────────────
export const useWorkoutExecutions = (workoutPlanId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["workout-executions", user?.id, workoutPlanId],
    queryFn: async () => {
      let query = supabase
        .from("workout_executions" as any)
        .select("*")
        .order("completed_at", { ascending: false });
      if (workoutPlanId) query = query.eq("workout_plan_id", workoutPlanId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useLogWorkoutExecution = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (execution: {
      workout_plan_id?: string;
      session_id?: string;
      feedback_energy?: number;
      feedback_muscle_pain?: number;
      feedback_sleep_quality?: number;
      feedback_notes?: string;
      duration_minutes?: number;
    }) => {
      const { data, error } = await supabase
        .from("workout_executions" as any)
        .insert({ ...execution, student_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workout-executions"] });
      qc.invalidateQueries({ queryKey: ["my-workout-plans"] });
      toast.success("Treino registrado! 💪");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
