import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, MessageSquare, Check, CheckCheck, Plus, Search, Megaphone, X, Loader2, Users } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import { usePlan } from "@/hooks/usePlan";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastFilter, setBroadcastFilter] = useState<"all" | "active" | "at_risk" | "inactive">("all");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, role } = useAuth();
  const { canUse } = usePlan();
  const { data: conversations, isLoading: isLoadingConversations } = useConversations();
  const { data: messages, isLoading: isLoadingMessages } = useMessages(selectedPartner || undefined);
  const sendMessage = useSendMessage();
  const { data: students } = useStudents();
  const { data: trainerProfile } = useTrainerProfile();

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !students) return;
    setBroadcastSending(true);
    try {
      const targets = students.filter((s) =>
        broadcastFilter === "all" || s.status === broadcastFilter
      );
      await Promise.all(
        targets.map((s) =>
          supabase.from("messages").insert({
            sender_id: user!.id,
            receiver_id: s.user_id,
            content: broadcastMsg,
          })
        )
      );
      toast.success(`Mensagem enviada para ${targets.length} aluno${targets.length !== 1 ? "s" : ""}!`);
      setShowBroadcast(false);
      setBroadcastMsg("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBroadcastSending(false);
    }
  };

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
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-1">MENSAGENS</p>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Comunicação</h1>
          </div>
          {role === "trainer" && (
            canUse("bulk_message") ? (
              <Button onClick={() => setShowBroadcast(true)} variant="outline" className="gap-2 rounded-xl h-10 text-sm">
                <Megaphone className="h-4 w-4" /> Mensagem em massa
              </Button>
            ) : (
              <Button variant="outline" className="gap-2 rounded-xl h-10 text-sm opacity-50 cursor-not-allowed" title="Disponível no plano Pro" disabled>
                <Megaphone className="h-4 w-4" /> Em massa (Pro)
              </Button>
            )
          )}
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="border border-border rounded-2xl overflow-hidden bg-card flex flex-col md:grid md:grid-cols-[300px_1fr] md:gap-0 h-[65dvh] min-h-[450px]"
        >
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
            {isLoadingConversations ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
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
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      <div className="flex justify-start"><Skeleton className="h-12 w-3/4 rounded-2xl rounded-bl-md" /></div>
                      <div className="flex justify-end"><Skeleton className="h-12 w-1/2 rounded-2xl rounded-br-md" /></div>
                      <div className="flex justify-start"><Skeleton className="h-16 w-2/3 rounded-2xl rounded-bl-md" /></div>
                      <div className="flex justify-end"><Skeleton className="h-10 w-1/3 rounded-2xl rounded-br-md" /></div>
                    </div>
                  ) : Object.entries(groupedMessages).map(([date, msgs]) => (
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
                  {!isLoadingMessages && (!messages || messages.length === 0) && (
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
      {/* Broadcast modal */}
      <AnimatePresence>
        {showBroadcast && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setShowBroadcast(false)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="bg-background border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between mb-2 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <p className="font-bold text-base">Mensagem em Massa</p>
                </div>
                <button onClick={() => setShowBroadcast(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-xl">
                  <X className="h-4 w-4" />
                </button>
                </div>
                <p className="text-sm text-muted-foreground mb-5 px-6">Envie uma mensagem para um grupo de alunos de uma vez.</p>
                <div className="space-y-4 px-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Destinatários
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "all", label: `Todos (${students?.length || 0})` },
                      { key: "active", label: `Ativos (${students?.filter((s) => s.status === "active").length || 0})` },
                      { key: "at_risk", label: `Em risco (${students?.filter((s) => s.status === "at_risk").length || 0})` },
                      { key: "inactive", label: `Inativos (${students?.filter((s) => s.status === "inactive").length || 0})` },
                    ].map((f) => (
                      <button key={f.key} onClick={() => setBroadcastFilter(f.key as any)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all min-h-[36px] ${broadcastFilter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mensagem</label>
                  <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Digite o comunicado para seus alunos..." rows={4}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <Button onClick={handleBroadcast} disabled={!broadcastMsg.trim() || broadcastSending} className="w-full h-12 rounded-xl">
                  {broadcastSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar comunicado
                </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default MessagesPage;
