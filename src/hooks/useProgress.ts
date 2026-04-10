import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Body Measurements ─────────────────────────────────────────
export const useBodyMeasurements = (studentId?: string) => {
  const { user, role } = useAuth();
  const targetId = studentId || (role === "student" ? user?.id : undefined);

  return useQuery({
    queryKey: ["body-measurements", targetId],
    queryFn: async () => {
      let query = supabase
        .from("body_measurements" as any)
        .select("*")
        .order("measured_at", { ascending: false });

      if (targetId) {
        query = query.eq("student_id", targetId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useCreateBodyMeasurement = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (measurement: {
      student_id: string;
      measured_at?: string;
      weight_kg?: number;
      height_cm?: number;
      body_fat_pct?: number;
      chest_cm?: number;
      waist_cm?: number;
      hip_cm?: number;
      arm_cm?: number;
      thigh_cm?: number;
      calf_cm?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("body_measurements" as any)
        .insert({ ...measurement, trainer_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-measurements"] });
      toast.success("Medidas registradas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateBodyMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("body_measurements" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-measurements"] });
      toast.success("Medidas atualizadas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteBodyMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("body_measurements" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["body-measurements"] });
      toast.success("Registro removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Convenient hook to get latest measurement for weight chart
export const useWeightHistory = (studentId?: string) => {
  const { user, role } = useAuth();
  const targetId = studentId || (role === "student" ? user?.id : undefined);

  return useQuery({
    queryKey: ["weight-history", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_measurements" as any)
        .select("measured_at, weight_kg, body_fat_pct")
        .eq("student_id", targetId!)
        .not("weight_kg", "is", null)
        .order("measured_at", { ascending: true })
        .limit(30);
      if (error) throw error;
      return (data as any[]).map((d: any) => ({
        date: d.measured_at,
        weight: Number(d.weight_kg),
        fat: d.body_fat_pct ? Number(d.body_fat_pct) : undefined,
      }));
    },
    enabled: !!targetId,
  });
};
