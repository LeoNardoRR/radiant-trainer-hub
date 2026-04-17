import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ChevronRight, Flame, Trophy,
  Phone, Mail, Calendar, TrendingUp, TrendingDown,
  Plus, MoreHorizontal,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  MOCK_STUDENTS, getInitials, getStatusLabel, getPlanLabel,
  formatCurrency, formatDate, daysSince, type StudentStatus,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { value: StudentStatus | 'all'; label: string }[] = [
  { value: 'all',     label: 'Todos'    },
  { value: 'active',  label: 'Ativos'   },
  { value: 'at_risk', label: 'Em risco' },
  { value: 'new',     label: 'Novos'    },
  { value: 'churned', label: 'Inativos' },
];

function RetentionBar({ score }: { score: number }) {
  const cls = score >= 70 ? '' : score >= 50 ? 'warning' : 'risk';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-semibold', score >= 70 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-risk')}>
          {score}%
        </span>
      </div>
      <div className="progress-bar h-1">
        <div className={cn('progress-bar-fill', cls)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StudentStatus }) {
  const cls: Record<StudentStatus, string> = {
    active:  'badge-success',
    at_risk: 'badge-risk',
    new:     'badge-neutral',
    churned: 'badge-neutral',
  };
  return <span className={cls[status]}>{getStatusLabel(status)}</span>;
}

function PlanBadge({ plan }: { plan: 'basic' | 'premium' | 'elite' }) {
  const cls = {
    basic:   'bg-muted text-muted-foreground',
    premium: 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/20',
    elite:   'bg-warning/10 text-warning ring-1 ring-warning/20',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cls[plan])}>
      {plan === 'elite' && <Trophy className="mr-1 size-2.5" />}
      {getPlanLabel(plan)}
    </span>
  );
}

export function Students() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => MOCK_STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  }), [search, statusFilter]);

  const selectedStudent = MOCK_STUDENTS.find(s => s.id === selected);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Alunos"
        subtitle={`${MOCK_STUDENTS.length} alunos cadastrados`}
        action={{ label: 'Novo aluno', onClick: () => {} }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className={cn('flex flex-col', selected ? 'w-[55%]' : 'flex-1')}>
          {/* Filters */}
          <div className="flex items-center gap-3 border-b border-border px-6 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar aluno..."
                className="h-9 w-full rounded-xl border border-border bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-1.5">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn('chip', statusFilter === f.value && 'selected')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Aluno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-32">Retenção</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Último treino</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Valor/mês</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence>
                  {filtered.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      onClick={() => setSelected(student.id === selected ? null : student.id)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        student.id === selected ? 'bg-primary/5' : 'hover:bg-muted/30',
                      )}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'avatar size-8 text-[10px] shrink-0',
                            student.status === 'at_risk' && 'bg-risk/10 text-risk',
                          )}>
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.goal}</p>
                          </div>
                          {student.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-warning">
                              <Flame className="size-3" />{student.streak}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3"><PlanBadge plan={student.plan} /></td>
                      <td className="px-4 py-3"><StatusBadge status={student.status} /></td>
                      <td className="px-4 py-3"><RetentionBar score={student.retentionScore} /></td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs', !student.lastSession && 'text-risk')}>
                          {student.lastSession ? formatDate(student.lastSession) : 'Nunca'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(student.monthlyValue)}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="size-8 text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedStudent && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '45%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-l border-border bg-card"
            >
              <div className="h-full overflow-y-auto scrollbar-thin p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'avatar size-12 text-sm',
                      selectedStudent.status === 'at_risk' && 'bg-risk/10 text-risk',
                    )}>
                      {getInitials(selectedStudent.name)}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">{selectedStudent.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={selectedStudent.status} />
                        <PlanBadge plan={selectedStudent.plan} />
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => setSelected(null)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                {/* Retention Score */}
                <div className={cn(
                  'rounded-xl p-4 mb-5 border',
                  selectedStudent.retentionScore < 50 ? 'border-risk/20 bg-risk/5' : 'border-border bg-muted/30'
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score de Retenção</span>
                    <span className={cn(
                      'text-2xl font-display font-bold',
                      selectedStudent.retentionScore >= 70 ? 'text-success' :
                      selectedStudent.retentionScore >= 50 ? 'text-warning' : 'text-risk'
                    )}>
                      {selectedStudent.retentionScore}
                    </span>
                  </div>
                  <div className="progress-bar h-2">
                    <div
                      className={cn('progress-bar-fill',
                        selectedStudent.retentionScore < 50 ? 'risk' :
                        selectedStudent.retentionScore < 70 ? 'warning' : ''
                      )}
                      style={{ width: `${selectedStudent.retentionScore}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Sessões', value: selectedStudent.completedSessions },
                    { label: 'Sequência', value: `${selectedStudent.streak}🔥` },
                    { label: 'Faltas', value: selectedStudent.totalSessions - selectedStudent.completedSessions },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl bg-muted/40 p-3 text-center">
                      <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Contact */}
                <div className="space-y-2 mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h3>
                  <a href={`mailto:${selectedStudent.email}`} className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors">
                    <Mail className="size-3.5 text-muted-foreground shrink-0" />
                    {selectedStudent.email}
                  </a>
                  <a href={`tel:${selectedStudent.phone}`} className="flex items-center gap-2.5 rounded-xl bg-muted/30 px-3 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors">
                    <Phone className="size-3.5 text-muted-foreground shrink-0" />
                    {selectedStudent.phone}
                  </a>
                </div>

                {/* Sessions */}
                <div className="space-y-2 mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximas sessões</h3>
                  {selectedStudent.nextSession ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
                      <Calendar className="size-3.5 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{formatDate(selectedStudent.nextSession)}</span>
                      <span className="badge-success ml-auto">Agendado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl border border-risk/20 bg-risk/5 px-3 py-2.5">
                      <Calendar className="size-3.5 text-risk shrink-0" />
                      <span className="text-sm text-risk">Sem próxima sessão</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full rounded-xl h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm">
                    <Plus className="size-3.5 mr-1.5" />
                    Agendar sessão
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl h-9 border-border text-sm">
                    Enviar mensagem
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
