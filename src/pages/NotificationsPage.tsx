import { motion } from "framer-motion";
import { Bell, Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
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

const iconConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  scheduling: { icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
  retention: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  achievement: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  system: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" },
};

const NotificationsPage = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unread = notifications?.filter((n) => !n.is_read) || [];
  const read = notifications?.filter((n) => n.is_read) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-start justify-between gap-4">
          <div>
            <p className="text-editorial-sm text-muted-foreground mb-1">NOTIFICAÇÕES</p>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">Centro de alertas</h1>
          </div>
          {unread.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} className="text-primary font-medium shrink-0">
              Marcar todas como lidas
            </Button>
          )}
        </motion.div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground font-body py-12 text-center animate-pulse">Carregando...</p>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-7 w-7 text-muted-foreground/50" strokeWidth={1.2} />
            </div>
            <p className="text-sm text-muted-foreground font-body">Nenhuma notificação ainda</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                <p className="text-editorial-sm text-xs text-muted-foreground mb-3 flex items-center gap-2">
                  NÃO LIDAS <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">{unread.length}</span>
                </p>
                <div className="space-y-1">
                  {unread.map((notif) => {
                    const cfg = iconConfig[notif.type] || iconConfig.system;
                    const Icon = cfg.icon;
                    return (
                      <div key={notif.id} onClick={() => markRead.mutate(notif.id)}
                        className="flex gap-3 p-4 border border-border rounded-xl hover:border-primary/30 hover:shadow-sm active:bg-accent/50 transition-all cursor-pointer min-h-[64px] bg-card">
                        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-body text-sm font-medium">{notif.title}</p>
                            <span className="text-[10px] text-muted-foreground font-body shrink-0">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-[12px] font-body text-muted-foreground mt-0.5">{notif.message}</p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {read.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                <p className="text-editorial-sm text-xs text-muted-foreground mb-3">ANTERIORES</p>
                <div className="space-y-1">
                  {read.map((notif) => {
                    const cfg = iconConfig[notif.type] || iconConfig.system;
                    const Icon = cfg.icon;
                    return (
                      <div key={notif.id} className="flex gap-3 p-4 border border-border rounded-xl opacity-60 min-h-[64px]">
                        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-body text-sm">{notif.title}</p>
                            <span className="text-[10px] text-muted-foreground font-body shrink-0">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-[12px] font-body text-muted-foreground mt-0.5">{notif.message}</p>
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
