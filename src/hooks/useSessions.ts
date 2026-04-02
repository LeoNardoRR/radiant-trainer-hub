import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database, Tables } from "@/integrations/supabase/types";

type SessionStatus = Database["public"]["Enums"]["session_status"];
type BaseSession = Tables<"sessions">;

interface SessionProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export interface SessionWithProfiles extends BaseSession {
  student: SessionProfile | null;
  trainer: SessionProfile | null;
}

export const useSessions = () => {
  const { user } = useAuth();

  return useQuery<SessionWithProfiles[]>({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;

      // Fetch profiles for all involved user IDs
      const userIds = new Set<string>();
      data?.forEach((s) => {
        userIds.add(s.student_id);
        userIds.add(s.trainer_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((s) => ({
        ...s,
        student: profileMap.get(s.student_id) || null,
        trainer: profileMap.get(s.trainer_id) || null,
      }));
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
      // Check for double booking
      const { data: existing } = await supabase
        .from("sessions")
        .select("id")
        .eq("trainer_id", session.trainer_id)
        .eq("date", session.date)
        .eq("start_time", session.start_time)
        .in("status", ["pending", "approved"]);

      if (existing && existing.length > 0) {
        throw new Error("Este horário já está ocupado. Escolha outro.");
      }

      // Block past dates
      const sessionDate = new Date(`${session.date}T${session.start_time}`);
      if (sessionDate < new Date()) {
        throw new Error("Não é possível agendar no passado.");
      }

      const { data, error } = await supabase
        .from("sessions")
        .insert({ ...session, student_id: user!.id })
        .select()
        .single();
      if (error) throw error;

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
      status: SessionStatus;
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
        title:
          status === "approved"
            ? "Agendamento aprovado"
            : status === "rejected"
            ? "Agendamento recusado"
            : "Atualização de sessão",
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
