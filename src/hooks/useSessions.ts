import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useSessions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;

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
      student_id: string;
      trainer_id: string;
      date: string;
      start_time: string;
      end_time: string;
      session_type?: string;
      notes?: string;
      original_session_id?: string;
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
        .insert({
          student_id: session.student_id,
          trainer_id: session.trainer_id,
          date: session.date,
          start_time: session.start_time,
          end_time: session.end_time,
          session_type: session.session_type,
          notes: session.notes,
          original_session_id: session.original_session_id || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Notify student about new session
      await supabase.from("notifications").insert({
        user_id: session.student_id,
        title: "Nova sessão agendada",
        message: `Sessão marcada para ${session.date} às ${session.start_time}`,
        type: "scheduling",
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Sessão criada com sucesso!");
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
      const updateData: Record<string, unknown> = { status };

      // When marking as missed, set makeup_deadline based on trainer settings
      if (status === "missed") {
        const { data: session } = await supabase
          .from("sessions")
          .select("trainer_id")
          .eq("id", id)
          .single();

        if (session) {
          const { data: settings } = await supabase
            .from("trainer_settings")
            .select("makeup_days_limit")
            .eq("trainer_id", session.trainer_id)
            .single();

          const days = (settings as any)?.makeup_days_limit ?? 7;
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + days);
          updateData.makeup_deadline = deadline.toISOString().split("T")[0];
        }
      }

      const { error } = await supabase
        .from("sessions")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;

      // Update streak when completing
      if (status === "completed") {
        const { data: session } = await supabase
          .from("sessions")
          .select("student_id")
          .eq("id", id)
          .single();
        if (session) {
          const today = new Date().toISOString().split("T")[0];
          const { data: existingStreak } = await supabase
            .from("user_streaks")
            .select("*")
            .eq("user_id", session.student_id)
            .maybeSingle();

          if (!existingStreak) {
            await supabase.from("user_streaks").insert({
              user_id: session.student_id,
              current_streak: 1,
              longest_streak: 1,
              total_workouts: 1,
              last_workout_date: today,
            });
          } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];
            const newStreak = existingStreak.last_workout_date === yesterdayStr
              ? existingStreak.current_streak + 1
              : existingStreak.last_workout_date === today
              ? existingStreak.current_streak
              : 1;
            await supabase.from("user_streaks").update({
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, existingStreak.longest_streak),
              total_workouts: existingStreak.total_workouts + (existingStreak.last_workout_date === today ? 0 : 1),
              last_workout_date: today,
            }).eq("user_id", session.student_id);
          }
        }
      }

      const messages: Record<string, string> = {
        approved: "Seu agendamento foi aprovado!",
        rejected: "Seu agendamento foi recusado.",
        cancelled: "Sessão cancelada.",
        completed: "Sessão concluída! 🎉",
        missed: "Falta registrada. Você tem dias para repor esta aula.",
      };

      await supabase.from("notifications").insert({
        user_id: student_id,
        title:
          status === "approved"
            ? "Agendamento aprovado"
            : status === "rejected"
            ? "Agendamento recusado"
            : status === "missed"
            ? "Falta registrada — reposição disponível"
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

// Hook to get missed sessions with active makeup deadline for a student
export const useMakeupSessions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["makeup-sessions", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("student_id", user!.id)
        .eq("status", "missed")
        .gte("makeup_deadline", today)
        .order("makeup_deadline", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
