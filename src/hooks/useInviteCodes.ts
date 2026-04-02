import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useInviteCodes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invite-codes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("trainer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const useCreateInviteCode = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const code = generateCode();
      const { data, error } = await supabase
        .from("invite_codes")
        .insert({ trainer_id: user!.id, code })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["invite-codes"] });
      toast.success(`Código criado: ${data.code}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useRedeemInviteCode = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      // Find the code
      const { data: invite, error: findErr } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", code.toUpperCase().trim())
        .eq("is_used", false)
        .single();

      if (findErr || !invite) throw new Error("Código inválido ou já utilizado.");

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error("Este código expirou.");
      }

      // Link student to trainer
      const { error: updateProfileErr } = await supabase
        .from("profiles")
        .update({ trainer_id: invite.trainer_id })
        .eq("user_id", user!.id);

      if (updateProfileErr) throw updateProfileErr;

      // Mark code as used
      const { error: updateCodeErr } = await supabase
        .from("invite_codes")
        .update({ is_used: true, used_by: user!.id })
        .eq("id", invite.id);

      if (updateCodeErr) throw updateCodeErr;

      return invite;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Vinculado ao personal com sucesso! Recarregue a pagina para ver as alteracoes.");
      // Reload to refresh auth context with new trainer_id
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
