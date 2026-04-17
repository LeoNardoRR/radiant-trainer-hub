import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Flame, CreditCard, Calendar, Gift, CheckCheck, Bell } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { MOCK_NOTIFICATIONS, getInitials, type Notification } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_ICONS: Record<Notification['type'], any> = {
  retention_risk: AlertTriangle,
  missed_session: Calendar,
  streak: Flame,
  payment: CreditCard,
  birthday: Gift,
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  retention_risk: 'text-risk bg-risk/10',
  missed_session: 'text-warning bg-warning/10',
  streak: 'text-warning bg-warning/10',
  payment: 'text-blue-400 bg-blue-400/10',
  birthday: 'text-primary bg-primary/10',
};

const PRIORITY_BORDER: Record<Notification['priority'], string> = {
  high: 'border-risk/25 bg-risk/5',
  medium: 'border-warning/25 bg-warning/5',
  low: 'border-border bg-muted/20',
};

function NotificationCard({ notif, onMarkRead }: { notif: Notification; onMarkRead: (id: string) => void }) {
  const Icon = TYPE_ICONS[notif.type];
  const iconCls = TYPE_COLORS[notif.type];
  const borderCls = PRIORITY_BORDER[notif.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn('rounded-2xl border p-4 transition-all', borderCls, !notif.read && 'shadow-sm')}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', iconCls)}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="avatar size-5 text-[8px] shrink-0">{getInitials(notif.studentName)}</div>
            <span className="text-sm font-semibold text-foreground">{notif.studentName}</span>
            {!notif.read && (
              <span className="size-1.5 rounded-full bg-primary shrink-0" />
            )}
            <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(notif.createdAt), { locale: ptBR, addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
          {notif.action && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" className="h-7 rounded-lg px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                {notif.action}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg px-3 text-xs text-muted-foreground"
                onClick={() => onMarkRead(notif.id)}
              >
                Dispensar
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Alerts() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'high') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const highCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Alertas de Retenção"
        subtitle="Ações inteligentes para manter seus alunos engajados"
      />

      <div className="flex-1 p-6 max-w-2xl">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: notifications.length, icon: Bell, cls: '' },
            { label: 'Não lidos', value: unreadCount, icon: AlertTriangle, cls: 'text-risk' },
            { label: 'Alta prioridade', value: highCount, icon: AlertTriangle, cls: 'text-risk' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
              <Icon className={cn('size-4 shrink-0', cls || 'text-muted-foreground')} />
              <div>
                <p className="font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            {(['all', 'unread', 'high'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn('chip', filter === f && 'selected')}>
                {f === 'all' ? 'Todos' : f === 'unread' ? 'Não lidos' : 'Alta prioridade'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground" onClick={markAllRead}>
              <CheckCheck className="size-3.5" />
              Marcar todos como lidos
            </Button>
          )}
        </div>

        {/* List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(notif => (
              <NotificationCard key={notif.id} notif={notif} onMarkRead={markRead} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Bell className="size-7 text-primary" />
              </div>
              <p className="font-display text-lg font-bold text-foreground">Tudo em dia!</p>
              <p className="text-sm text-muted-foreground mt-1">Nenhum alerta no momento.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
