import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMessages = (otherUserId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["messages", user?.id, otherUserId],
    queryFn: async () => {
      if (!otherUserId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!otherUserId,
    refetchInterval: 5000,
  });
};

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Collect all partner IDs
      const convMap = new Map<string, typeof data[0]>();
      data?.forEach((msg) => {
        const partnerId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
      });

      // Fetch partner profiles
      const partnerIds = Array.from(convMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", partnerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      return Array.from(convMap.entries()).map(([partnerId, lastMsg]) => ({
        partnerId,
        partnerName: profileMap.get(partnerId) || "Usuário",
        lastMessage: lastMsg.content,
        time: lastMsg.created_at,
        unread: lastMsg.receiver_id === user!.id && !lastMsg.is_read,
      }));
    },
    enabled: !!user,
    refetchInterval: 10000,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: receiverId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
