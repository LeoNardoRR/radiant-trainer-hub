import { motion } from "framer-motion";
import { Bell, Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const iconMap: Record<string, typeof Bell> = {
  scheduling: Calendar,
  retention: AlertTriangle,
  achievement: TrendingUp,
  system: Bell,
};

const NotificationsPage = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unread = notifications?.filter((n) => !n.is_read) || [];
  const read = notifications?.filter((n) => n.is_read) || [];

  const handleClick = (id: string, isRead: boolean) => {
    if (!isRead) markRead.mutate(id);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-2">NOTIFICAÇÕES</p>
            <h1 className="font-display font-light text-2xl md:text-3xl tracking-tight">Centro de alertas</h1>
          </div>
          {unread.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-editorial-sm text-muted-foreground hover:text-foreground transition-colors text-[9px]"
            >
              Marcar todas como lidas
            </button>
          )}
        </motion.div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground font-body font-light py-12 text-center animate-pulse">Carregando...</p>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground font-body font-light">Nenhuma notificação ainda</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                <p className="text-editorial-sm text-muted-foreground mb-3">NÃO LIDAS ({unread.length})</p>
                <div className="space-y-0">
                  {unread.map((notif) => {
                    const Icon = iconMap[notif.type] || Bell;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleClick(notif.id, false)}
                        className="flex gap-3 py-4 border-t border-border hover:bg-accent/30 transition-colors duration-300 px-3 -mx-3 cursor-pointer"
                      >
                        <div className="w-7 h-7 border border-foreground/10 flex items-center justify-center shrink-0">
                          <Icon className="h-3 w-3 text-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-body text-sm truncate">{notif.title}</p>
                            <span className="text-[10px] text-muted-foreground font-body shrink-0">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-[11px] font-body font-light text-muted-foreground truncate">{notif.message}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-foreground shrink-0 mt-2" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {read.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                <p className="text-editorial-sm text-muted-foreground mb-3">ANTERIORES</p>
                <div className="space-y-0">
                  {read.map((notif) => {
                    const Icon = iconMap[notif.type] || Bell;
                    return (
                      <div key={notif.id} className="flex gap-3 py-4 border-t border-border px-3 -mx-3 opacity-50">
                        <div className="w-7 h-7 border border-border flex items-center justify-center shrink-0">
                          <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-body text-sm truncate">{notif.title}</p>
                            <span className="text-[10px] text-muted-foreground font-body shrink-0">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-[11px] font-body font-light text-muted-foreground truncate">{notif.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
