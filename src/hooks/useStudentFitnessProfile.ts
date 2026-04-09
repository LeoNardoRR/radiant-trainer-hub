import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FitnessProfile {
  id: string;
  user_id: string;
  trainer_id: string;
  objective: string;
  level: string;
  training_location: string;
  notes: string | null;
}

export const useStudentFitnessProfile = (userId?: string) => {
  return useQuery({
    queryKey: ["fitness-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_fitness_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as FitnessProfile | null;
    },
    enabled: !!userId,
  });
};

export const useUpsertFitnessProfile = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: {
      user_id: string;
      objective: string;
      level: string;
      training_location: string;
      notes?: string;
    }) => {
      // Check if profile exists
      const { data: existing } = await supabase
        .from("student_fitness_profiles")
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("student_fitness_profiles")
          .update({
            objective: profile.objective,
            level: profile.level,
            training_location: profile.training_location,
            notes: profile.notes || null,
          })
          .eq("user_id", profile.user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("student_fitness_profiles")
          .insert({
            user_id: profile.user_id,
            trainer_id: user!.id,
            objective: profile.objective,
            level: profile.level,
            training_location: profile.training_location,
            notes: profile.notes || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fitness-profile"] });
      toast.success("Perfil fitness atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
