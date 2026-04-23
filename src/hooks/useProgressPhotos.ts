import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ProgressPhoto = {
  id: string;
  student_id: string;
  photo_url: string;
  type: 'front' | 'side' | 'back' | 'other';
  captured_at: string;
  notes?: string;
  created_at: string;
};

export const useProgressPhotos = (studentId?: string) => {
  const { user } = useAuth();
  const targetId = studentId || user?.id;

  return useQuery({
    queryKey: ["progress-photos", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("student_id", targetId)
        .order("captured_at", { ascending: false });

      if (error) throw error;
      return data as ProgressPhoto[];
    },
    enabled: !!targetId,
  });
};

export const useCreateProgressPhoto = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: Omit<ProgressPhoto, 'id' | 'created_at'>) => {
      const { error } = await supabase.from("progress_photos").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["progress-photos", variables.student_id] });
      toast.success("Foto salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar foto: " + error.message);
    },
  });
};

export const useDeleteProgressPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const { error } = await supabase.from("progress_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["progress-photos", variables.studentId] });
      toast.success("Foto removida!");
    },
  });
};
