import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const useMessages = (otherUserId?: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime subscription for messages
  useEffect(() => {
    if (!user || !otherUserId) return;

    const channel = supabase
      .channel(`messages-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (
            msg &&
            ((msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
              (msg.sender_id === otherUserId && msg.receiver_id === user.id))
          ) {
            qc.invalidateQueries({ queryKey: ["messages", user.id, otherUserId] });
            qc.invalidateQueries({ queryKey: ["conversations"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, qc]);

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

      // Mark received messages as read
      const unreadIds = data
        ?.filter((m) => m.receiver_id === user!.id && !m.is_read)
        .map((m) => m.id);
      if (unreadIds && unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }

      return data;
    },
    enabled: !!user && !!otherUserId,
  });
};

export const useConversations = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Realtime for new conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg && (msg.sender_id === user.id || msg.receiver_id === user.id)) {
            qc.invalidateQueries({ queryKey: ["conversations"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const convMap = new Map<string, typeof data[0]>();
      const unreadMap = new Map<string, number>();
      data?.forEach((msg) => {
        const partnerId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
        if (msg.receiver_id === user!.id && !msg.is_read) {
          unreadMap.set(partnerId, (unreadMap.get(partnerId) || 0) + 1);
        }
      });

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
        unread: (unreadMap.get(partnerId) || 0) > 0,
        unreadCount: unreadMap.get(partnerId) || 0,
      }));
    },
    enabled: !!user,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content, fileUrl, fileType }: { receiverId: string; content: string; fileUrl?: string; fileType?: string }) => {
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: receiverId,
        content: content.trim(),
        file_url: fileUrl,
        file_type: fileType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
