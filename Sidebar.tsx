import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CalendarDays, BellRing, Settings,
  Dumbbell, TrendingUp, ChevronRight, LogOut, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/alunos',    icon: Users,           label: 'Alunos'       },
  { to: '/agenda',    icon: CalendarDays,    label: 'Agenda'       },
  { to: '/retencao',  icon: TrendingUp,      label: 'Retenção'     },
  { to: '/alertas',   icon: BellRing,        label: 'Alertas'      },
];

const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary">
          <Dumbbell className="size-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          FitApp
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to}>
              <motion.div
                className={cn('nav-item', isActive && 'active')}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="icon" />
                <span className="flex-1 text-sm">{label}</span>
                {label === 'Alertas' && unreadCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="size-3.5 opacity-40" />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Plan + User */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        {/* Quick actions hint */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary font-display">Pro Tip</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            2 alunos em risco de cancelamento hoje.
          </p>
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-sidebar-accent transition-colors cursor-pointer group">
          <div className="avatar size-8 text-xs shrink-0">PT</div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Personal Trainer</p>
            <p className="truncate text-[11px] text-muted-foreground">Plano Pro</p>
          </div>
          <LogOut className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </div>
    </aside>
  );
}
