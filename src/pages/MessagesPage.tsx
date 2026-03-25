import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

interface Message {
  id: number;
  from: "trainer" | "student";
  text: string;
  time: string;
}

const conversations: Conversation[] = [
  { id: 1, name: "Ana Silva", lastMessage: "Perfeito, obrigada!", time: "Há 5 min", unread: true },
  { id: 2, name: "Carlos Mendes", lastMessage: "Posso trocar o horário de terça?", time: "Há 1h", unread: true },
  { id: 3, name: "Maria Oliveira", lastMessage: "Vou tentar voltar semana que vem", time: "Há 3h", unread: false },
  { id: 4, name: "Lucas Ferreira", lastMessage: "Valeu, coach! 💪", time: "Ontem", unread: false },
  { id: 5, name: "Pedro Costa", lastMessage: "Desculpa pela falta", time: "Ontem", unread: false },
];

const mockMessages: Message[] = [
  { id: 1, from: "student", text: "Oi! Posso trocar o horário de terça para quinta?", time: "14:30" },
  { id: 2, from: "trainer", text: "Claro! Quinta às 08:00 funciona pra você?", time: "14:32" },
  { id: 3, from: "student", text: "Perfeito, obrigada!", time: "14:33" },
];

const MessagesPage = () => {
  const [selected, setSelected] = useState<number | null>(1);
  const [message, setMessage] = useState("");

  const selectedConv = conversations.find((c) => c.id === selected);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">MENSAGENS</p>
          <h1 className="font-display font-light text-3xl tracking-tight">Comunicação</h1>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-[1px] bg-border min-h-[500px]"
        >
          {/* Conversation list */}
          <div className="bg-background">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv.id)}
                className={`w-full text-left p-4 border-b border-border transition-colors duration-300 ${
                  selected === conv.id ? "bg-accent/50" : "hover:bg-accent/30"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-body text-sm">{conv.name}</p>
                  <span className="text-xs text-muted-foreground font-body">{conv.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground font-body font-light truncate flex-1">
                    {conv.lastMessage}
                  </p>
                  {conv.unread && <div className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />}
                </div>
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="bg-background flex flex-col">
            {selectedConv ? (
              <>
                <div className="p-4 border-b border-border">
                  <p className="font-body text-sm">{selectedConv.name}</p>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from === "trainer" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 ${
                          msg.from === "trainer"
                            ? "bg-foreground text-primary-foreground"
                            : "border border-border"
                        }`}
                      >
                        <p className="text-sm font-body font-light">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.from === "trainer" ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escreva uma mensagem..."
                      className="font-body font-light"
                    />
                    <button className="p-2 hover:bg-accent transition-colors">
                      <Send className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground font-body font-light">
                  Selecione uma conversa
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
