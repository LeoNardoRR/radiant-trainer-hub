import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const MessagesPage = () => {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [message, setMessage] = useState("");
  const [showConversations, setShowConversations] = useState(true);

  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const { data: messages } = useMessages(selectedPartner || undefined);
  const sendMessage = useSendMessage();

  const handleSelectConversation = (partnerId: string, name: string) => {
    setSelectedPartner(partnerId);
    setSelectedName(name);
    setShowConversations(false);
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedPartner) return;
    await sendMessage.mutateAsync({ receiverId: selectedPartner, content: message });
    setMessage("");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-1">MENSAGENS</p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Comunicação</h1>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="border border-border rounded-xl min-h-[60vh] md:min-h-[500px] flex flex-col md:grid md:grid-cols-[280px_1fr] md:gap-0 overflow-hidden bg-card">
          {/* Conversation list */}
          <div className={`border-r border-border overflow-y-auto ${
            !showConversations && selectedPartner ? "hidden md:block" : "block"
          }`}>
            {!conversations || conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground font-body">Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button key={conv.partnerId} onClick={() => handleSelectConversation(conv.partnerId, conv.partnerName)}
                  className={`w-full text-left p-4 border-b border-border transition-all duration-200 min-h-[64px] ${
                    selectedPartner === conv.partnerId ? "bg-accent/50" : "hover:bg-accent/30 active:bg-accent/50"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-display font-bold text-primary">{conv.partnerName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-body text-sm font-medium truncate">{conv.partnerName}</p>
                        <span className="text-[10px] text-muted-foreground font-body shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.time), { addSuffix: false, locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-muted-foreground font-body truncate flex-1">{conv.lastMessage}</p>
                        {conv.unread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
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
                <div className="p-3 border-b border-border flex items-center gap-3 min-h-[52px] bg-background/50">
                  <button onClick={() => { setShowConversations(true); setSelectedPartner(null); }}
                    className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-lg transition-colors">
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-display font-bold text-primary">{selectedName.charAt(0)}</span>
                  </div>
                  <p className="font-body text-sm font-medium">{selectedName}</p>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-muted/20">
                  {messages?.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border rounded-bl-sm"
                      }`}>
                        <p className="text-sm font-body">{msg.content}</p>
                        <p className={`text-[9px] mt-1 ${
                          msg.sender_id === user?.id ? "text-primary-foreground/50" : "text-muted-foreground"
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <p className="text-sm text-muted-foreground font-body text-center py-12">
                      Nenhuma mensagem ainda. Comece a conversa!
                    </p>
                  )}
                </div>
                <div className="p-3 border-t border-border bg-background safe-bottom">
                  <div className="flex gap-2">
                    <Input value={message} onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Escreva uma mensagem..." className="font-body h-12 rounded-xl" />
                    <button onClick={handleSend}
                      className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center shadow-md shadow-primary/20">
                      <Send className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-body">Selecione uma conversa</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
