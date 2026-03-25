import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useSessions = () => {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      const query = supabase
        .from("sessions")
        .select("*, student:profiles!sessions_student_id_fkey(*), trainer:profiles!sessions_trainer_id_fkey(*)")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateSession = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (session: {
      trainer_id: string;
      date: string;
      start_time: string;
      end_time: string;
      session_type?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ ...session, student_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Create notification for trainer
      await supabase.from("notifications").insert({
        user_id: session.trainer_id,
        title: "Novo agendamento pendente",
        message: `Novo pedido de sessão para ${session.date} às ${session.start_time}`,
        type: "scheduling",
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Solicitação enviada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateSessionStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      student_id,
    }: {
      id: string;
      status: "approved" | "rejected" | "cancelled" | "completed" | "missed";
      student_id: string;
    }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      const messages: Record<string, string> = {
        approved: "Seu agendamento foi aprovado!",
        rejected: "Seu agendamento foi recusado.",
        cancelled: "Sessão cancelada.",
        completed: "Sessão concluída!",
        missed: "Falta registrada.",
      };

      await supabase.from("notifications").insert({
        user_id: student_id,
        title: status === "approved" ? "Agendamento aprovado" : status === "rejected" ? "Agendamento recusado" : "Atualização de sessão",
        message: messages[status] || "Status atualizado.",
        type: "scheduling",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
