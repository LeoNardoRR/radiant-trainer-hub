import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, MapPin, Wifi, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { MOCK_SESSIONS, getInitials } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  scheduled:  'border-primary/30 bg-primary/5 text-primary',
  completed:  'border-success/30 bg-success/5 text-success',
  cancelled:  'border-muted bg-muted/30 text-muted-foreground line-through',
  no_show:    'border-risk/30 bg-risk/5 text-risk',
};

const STATUS_LABELS = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  no_show:   'Faltou',
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 6); // 6–18h

export function Schedule() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date('2025-04-10'), { locale: ptBR, weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(new Date('2025-04-11'));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const daySessions = MOCK_SESSIONS.filter(s => isSameDay(parseISO(s.date), selectedDay));

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Agenda"
        subtitle="Gerenciar sessões e disponibilidade"
        action={{ label: 'Novo agendamento', onClick: () => {} }}
      />

      <div className="flex-1 flex flex-col p-6 gap-4">
        {/* Week nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={() => setWeekStart(d => addDays(d, -7))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-display font-bold text-foreground capitalize">
              {format(weekStart, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={() => setWeekStart(d => addDays(d, 7))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-8 rounded-xl border-border text-xs" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoje
          </Button>
        </div>

        {/* Week strip */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const count = MOCK_SESSIONS.filter(s => isSameDay(parseISO(s.date), day)).length;
            const isSelected = isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'flex flex-col items-center rounded-2xl py-3 transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'hover:bg-muted/50 text-muted-foreground',
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                </span>
                <span className={cn('font-display text-xl font-bold', isSelected ? 'text-primary-foreground' : 'text-foreground')}>
                  {format(day, 'd')}
                </span>
                {count > 0 && (
                  <div className={cn('mt-1.5 flex gap-0.5', isSelected && 'opacity-70')}>
                    {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                      <span key={i} className={cn('size-1 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Day view */}
        <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-foreground capitalize">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <span className="badge-neutral">{daySessions.length} sessão{daySessions.length !== 1 ? 'ões' : ''}</span>
          </div>

          <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 440 }}>
            {HOURS.map(hour => {
              const session = daySessions.find(s => parseInt(s.time.split(':')[0]) === hour);
              return (
                <div key={hour} className="flex border-b border-border/40 min-h-[56px]">
                  <div className="w-16 shrink-0 flex items-start justify-end pr-4 pt-3">
                    <span className="text-xs text-muted-foreground">{String(hour).padStart(2, '0')}:00</span>
                  </div>
                  <div className="flex-1 border-l border-border/40 px-3 py-2">
                    {session && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn('flex items-center gap-3 rounded-xl border px-3 py-2', STATUS_STYLES[session.status])}
                      >
                        <div className="avatar size-7 text-[9px] shrink-0">
                          {getInitials(session.studentName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{session.studentName}</p>
                          <p className="text-xs opacity-70">{session.type}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs opacity-70">
                          <Clock className="size-3" />
                          {session.duration}min
                        </div>
                        <div className="shrink-0">
                          {session.location === 'online'
                            ? <Wifi className="size-3.5 opacity-70" />
                            : <MapPin className="size-3.5 opacity-70" />
                          }
                        </div>
                        <span className={cn('text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0', STATUS_STYLES[session.status])}>
                          {STATUS_LABELS[session.status]}
                        </span>
                      </motion.div>
                    )}
                    {!session && hour >= 7 && hour <= 18 && (
                      <button className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group">
                        <span className="flex items-center gap-1 text-xs text-primary rounded-lg border border-dashed border-primary/30 px-3 py-1 group-hover:bg-primary/5">
                          <Plus className="size-3" />Agendar
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
