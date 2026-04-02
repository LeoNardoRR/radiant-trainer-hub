import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, MessageSquare, Check, CheckCheck, Plus, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const formatMsgDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return "Hoje";
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM/yyyy");
};

// Hook to get trainer profile for students
const useTrainerProfile = () => {
  const { user, role, profile } = useAuth();
  return useQuery({
    queryKey: ["trainer-profile", profile?.trainer_id],
    queryFn: async () => {
      if (!profile?.trainer_id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .eq("user_id", profile.trainer_id)
        .single();
      return data;
    },
    enabled: !!user && role === "student" && !!profile?.trainer_id,
  });
};

const MessagesPage = () => {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [message, setMessage] = useState("");
  const [showConversations, setShowConversations] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, role } = useAuth();
  const { data: conversations } = useConversations();
  const { data: messages } = useMessages(selectedPartner || undefined);
  const sendMessage = useSendMessage();
  const { data: students } = useStudents();
  const { data: trainerProfile } = useTrainerProfile();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (partnerId: string, name: string) => {
    setSelectedPartner(partnerId);
    setSelectedName(name);
    setShowConversations(false);
    setShowNewChat(false);
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedPartner) return;
    const content = message;
    setMessage("");
    await sendMessage.mutateAsync({ receiverId: selectedPartner, content });
  };

  // Build contacts list for new chat
  const availableContacts = (() => {
    if (role === "trainer") {
      // Trainer can message any of their students
      const existingPartnerIds = new Set(conversations?.map(c => c.partnerId) || []);
      return (students || [])
        .filter(s => !existingPartnerIds.has(s.user_id))
        .filter(s => s.full_name.toLowerCase().includes(searchContact.toLowerCase()))
        .map(s => ({ id: s.user_id, name: s.full_name, email: s.email }));
    } else {
      // Student can message their trainer
      if (!trainerProfile) return [];
      const existingPartnerIds = new Set(conversations?.map(c => c.partnerId) || []);
      if (existingPartnerIds.has(trainerProfile.user_id)) return [];
      if (searchContact && !trainerProfile.full_name.toLowerCase().includes(searchContact.toLowerCase())) return [];
      return [{ id: trainerProfile.user_id, name: trainerProfile.full_name, email: trainerProfile.email }];
    }
  })();

  // Group messages by date
  const groupedMessages = messages?.reduce((acc, msg) => {
    const dateKey = formatMsgDate(msg.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>) || {};

  return (
    <AppLayout>
      <div className="space-y-4">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-1">MENSAGENS</p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Comunicação</h1>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="border border-border rounded-2xl min-h-[60vh] md:min-h-[500px] flex flex-col md:grid md:grid-cols-[300px_1fr] md:gap-0 overflow-hidden bg-card">
          
          {/* Conversation list */}
          <div className={`border-r border-border overflow-y-auto ${
            !showConversations && selectedPartner ? "hidden md:block" : "block"
          }`}>
            {/* New chat button */}
            <div className="p-3 border-b border-border">
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Nova conversa
              </button>
            </div>

            {/* New chat contact picker */}
            {showNewChat && (
              <div className="border-b border-border bg-muted/30">
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                      placeholder={role === "trainer" ? "Buscar aluno..." : "Buscar personal..."}
                      className="pl-10 h-10 text-sm rounded-xl"
                    />
                  </div>
                </div>
                {availableContacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3 px-3">
                    {role === "student" && !trainerProfile
                      ? "Vincule-se a um personal em Configurações primeiro."
                      : "Nenhum contato disponível"}
                  </p>
                ) : (
                  availableContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectConversation(contact.id, contact.name)}
                      className="w-full text-left p-3 px-4 hover:bg-accent/50 transition-colors flex items-center gap-3 min-h-[52px]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-display font-bold text-success">{contact.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{contact.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Existing conversations */}
            {!conversations || conversations.length === 0 ? (
              <EmptyState icon={MessageSquare} emoji="💬" title="Nenhuma conversa" description="Toque em 'Nova conversa' para começar." />
            ) : (
              conversations.map((conv) => (
                <button key={conv.partnerId} onClick={() => handleSelectConversation(conv.partnerId, conv.partnerName)}
                  className={`w-full text-left p-4 border-b border-border transition-all duration-200 min-h-[68px] ${
                    selectedPartner === conv.partnerId ? "bg-accent/50" : "hover:bg-accent/30 active:bg-accent/50"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-display font-bold text-primary">{conv.partnerName.charAt(0)}</span>
                      </div>
                      {conv.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary ring-2 ring-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-body text-sm truncate ${conv.unread ? "font-semibold" : "font-medium"}`}>{conv.partnerName}</p>
                        <span className="text-[10px] text-muted-foreground font-body shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.time), { addSuffix: false, locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`text-[11px] font-body truncate flex-1 ${conv.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-display font-bold shrink-0">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat */}
          <div className={`flex flex-col flex-1 ${showConversations && !selectedPartner ? "hidden md:flex" : "flex"}`}>
            {selectedPartner ? (
              <>
                <div className="p-3 border-b border-border flex items-center gap-3 min-h-[56px] bg-background/80 backdrop-blur-sm">
                  <button onClick={() => { setShowConversations(true); setSelectedPartner(null); }}
                    className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl transition-colors">
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-display font-bold text-primary">{selectedName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium">{selectedName}</p>
                    <p className="text-[10px] text-success font-body">Online</p>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-1 overflow-y-auto bg-muted/10">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="flex justify-center my-3">
                        <span className="text-[10px] text-muted-foreground font-body bg-muted/80 px-3 py-1 rounded-full">{date}</span>
                      </div>
                      {msgs?.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex mb-1.5 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] sm:max-w-[65%] p-3 ${
                            msg.sender_id === user?.id
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-card border border-border rounded-2xl rounded-bl-md"
                          }`}>
                            <p className="text-sm font-body leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center gap-1 justify-end mt-1 ${
                              msg.sender_id === user?.id ? "text-primary-foreground/50" : "text-muted-foreground"
                            }`}>
                              <span className="text-[9px]">
                                {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {msg.sender_id === user?.id && (
                                msg.is_read
                                  ? <CheckCheck className="h-3 w-3" />
                                  : <Check className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <EmptyState icon={MessageSquare} emoji="👋" title="Diga olá!" description="Comece uma conversa agora." />
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-border bg-background safe-bottom">
                  <div className="flex gap-2">
                    <Input value={message} onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      placeholder="Escreva uma mensagem..." className="font-body h-12 rounded-2xl" />
                    <button onClick={handleSend} disabled={!message.trim()}
                      className="p-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all min-h-[48px] min-w-[48px] flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none active:scale-95">
                      <Send className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState icon={MessageSquare} emoji="💬" title="Selecione uma conversa" description="Escolha um contato ou inicie uma nova conversa." />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
