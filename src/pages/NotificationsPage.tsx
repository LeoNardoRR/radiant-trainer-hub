import { motion } from "framer-motion";
import { Bell, Calendar, AlertTriangle, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

type NotifType = "scheduling" | "retention" | "achievement" | "system";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  { id: 1, type: "scheduling", title: "Novo agendamento", message: "Ana Silva solicitou sessão para Seg, 14:00", time: "Há 5 min", read: false },
  { id: 2, type: "retention", title: "Aluno em risco", message: "Maria Oliveira não treina há 5 dias", time: "Há 1h", read: false },
  { id: 3, type: "scheduling", title: "Novo agendamento", message: "Carlos Mendes solicitou sessão para Ter, 08:00", time: "Há 2h", read: false },
  { id: 4, type: "retention", title: "Faltas consecutivas", message: "Pedro Costa faltou 2x esta semana", time: "Há 3h", read: true },
  { id: 5, type: "achievement", title: "Conquista!", message: "Lucas Ferreira completou 30 treinos consecutivos", time: "Há 4h", read: true },
  { id: 6, type: "system", title: "Horários vagos", message: "Você tem 3 horários disponíveis hoje", time: "Há 6h", read: true },
  { id: 7, type: "retention", title: "Aluno inativo", message: "Camila Torres não treina há 15 dias", time: "Ontem", read: true },
  { id: 8, type: "scheduling", title: "Cancelamento", message: "Bruno Santos cancelou sessão de Sex, 16:00", time: "Ontem", read: true },
  { id: 9, type: "achievement", title: "Alta consistência", message: "Fernanda Alves mantém 95% de frequência este mês", time: "2 dias atrás", read: true },
  { id: 10, type: "retention", title: "Risco de abandono", message: "Bruno Santos cancelou 3 sessões no último mês", time: "2 dias atrás", read: true },
];

const iconMap: Record<NotifType, typeof Bell> = {
  scheduling: Calendar,
  retention: AlertTriangle,
  achievement: TrendingUp,
  system: Bell,
};

const NotificationsPage = () => {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-2">NOTIFICAÇÕES</p>
            <h1 className="font-display font-light text-3xl tracking-tight">Centro de alertas</h1>
          </div>
          {unread > 0 && (
            <button className="text-editorial-sm text-muted-foreground hover:text-foreground transition-colors">
              Marcar todas como lidas
            </button>
          )}
        </motion.div>

        {unread > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <p className="text-editorial-sm text-muted-foreground mb-4">NÃO LIDAS ({unread})</p>
            <div className="space-y-0">
              {notifications
                .filter((n) => !n.read)
                .map((notif, i) => {
                  const Icon = iconMap[notif.type];
                  return (
                    <motion.div
                      key={notif.id}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      custom={i + 2}
                      className="flex gap-4 py-5 border-t border-border hover:bg-accent/30 transition-colors duration-300 px-3 -mx-3 cursor-pointer"
                    >
                      <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-body text-sm">{notif.title}</p>
                          <span className="text-xs text-muted-foreground font-body shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-sm font-body font-light text-muted-foreground mt-0.5">{notif.message}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-foreground shrink-0 mt-2" />
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
          <p className="text-editorial-sm text-muted-foreground mb-4">ANTERIORES</p>
          <div className="space-y-0">
            {notifications
              .filter((n) => n.read)
              .map((notif, i) => {
                const Icon = iconMap[notif.type];
                return (
                  <div
                    key={notif.id}
                    className="flex gap-4 py-5 border-t border-border hover:bg-accent/30 transition-colors duration-300 px-3 -mx-3 cursor-pointer opacity-60"
                  >
                    <div className="w-8 h-8 border border-border flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="font-body text-sm">{notif.title}</p>
                        <span className="text-xs text-muted-foreground font-body shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-sm font-body font-light text-muted-foreground mt-0.5">{notif.message}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
