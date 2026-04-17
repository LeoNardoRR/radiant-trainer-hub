import { Bell, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="h-9 w-48 pl-9 text-sm bg-muted/50 border-border/50 focus:w-64 transition-all duration-200"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative size-9 rounded-xl">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground pulse-ring">
              {unread}
            </span>
          )}
        </Button>

        {action && (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={action.onClick}
            >
              <Plus className="size-3.5" />
              {action.label}
            </Button>
          </motion.div>
        )}
      </div>
    </header>
  );
}
