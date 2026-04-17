import { motion } from 'framer-motion';
import {
  Users, DollarSign, CalendarCheck, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Flame,
  ChevronRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import {
  MOCK_STATS, MOCK_STUDENTS, MOCK_SESSIONS, MOCK_NOTIFICATIONS,
  REVENUE_CHART_DATA, RETENTION_CHART_DATA,
  formatCurrency, getInitials, daysSince,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } } },
};

function StatCard({
  icon: Icon, label, value, delta, deltaLabel = 'este mês', colorClass = 'text-primary', bgClass = 'bg-primary/10',
}: {
  icon: any; label: string; value: string; delta: number; deltaLabel?: string;
  colorClass?: string; bgClass?: string;
}) {
  const positive = delta >= 0;
  return (
    <motion.div variants={stagger.item} className="stat-card">
      <div className="flex items-start justify-between">
        <div className={cn('flex size-10 items-center justify-center rounded-xl', bgClass)}>
          <Icon className={cn('size-5', colorClass)} />
        </div>
        <span className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-success' : 'text-risk')}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta)}{typeof delta === 'number' && delta < 10 ? '' : '%'}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-display font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">{deltaLabel}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm font-semibold text-foreground">
          {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value}%`}
        </p>
      ))}
    </div>
  );
};

export function Dashboard() {
  const todaySessions = MOCK_SESSIONS.filter(s => s.date === '2025-04-11' && s.status === 'scheduled');
  const atRisk = MOCK_STUDENTS.filter(s => s.status === 'at_risk');
  const unreadAlerts = MOCK_NOTIFICATIONS.filter(n => !n.read);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Dashboard"
        subtitle={`Bom dia! Você tem ${todaySessions.length} sessões hoje.`}
        action={{ label: 'Nova sessão', onClick: () => {} }}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Grid */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatCard
            icon={Users}
            label="Alunos ativos"
            value={String(MOCK_STATS.activeStudents)}
            delta={MOCK_STATS.activeStudentsDelta}
            deltaLabel={`+${MOCK_STATS.activeStudentsDelta} este mês`}
          />
          <StatCard
            icon={DollarSign}
            label="Receita mensal"
            value={formatCurrency(MOCK_STATS.monthlyRevenue)}
            delta={MOCK_STATS.monthlyRevenueDelta}
            deltaLabel={`+${MOCK_STATS.monthlyRevenueDelta}% vs mês ant.`}
          />
          <StatCard
            icon={CalendarCheck}
            label="Sessões realizadas"
            value={String(MOCK_STATS.sessionsThisMonth)}
            delta={MOCK_STATS.sessionsDelta}
            deltaLabel={`+${MOCK_STATS.sessionsDelta}% de adesão`}
            colorClass="text-blue-400"
            bgClass="bg-blue-400/10"
          />
          <StatCard
            icon={TrendingUp}
            label="Taxa de retenção"
            value={`${MOCK_STATS.retentionRate}%`}
            delta={MOCK_STATS.retentionDelta}
            deltaLabel="vs mês anterior"
            colorClass="text-warning"
            bgClass="bg-warning/10"
          />
        </motion.div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-foreground">Receita mensal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
              </div>
              <span className="badge-success">+{MOCK_STATS.monthlyRevenueDelta}%</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={REVENUE_CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 18%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 15% 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(215 15% 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Retention Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-foreground">Retenção</h3>
                <p className="text-xs text-muted-foreground mt-0.5">% de alunos ativos</p>
              </div>
              <span className={MOCK_STATS.retentionDelta < 0 ? 'badge-risk' : 'badge-success'}>
                {MOCK_STATS.retentionDelta}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={RETENTION_CHART_DATA} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 18%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 15% 55%)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'hsl(215 15% 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Today's Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">Hoje</h3>
              <a href="/agenda" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Ver agenda <ChevronRight className="size-3" />
              </a>
            </div>
            <div className="space-y-2.5">
              {todaySessions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão hoje.</p>
              )}
              {todaySessions.map(session => (
                <div key={session.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                  <div className="avatar size-8 text-[10px] shrink-0">
                    {getInitials(session.studentName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{session.studentName}</p>
                    <p className="text-xs text-muted-foreground">{session.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <Clock className="size-3" />{session.time}
                    </p>
                    <span className={cn('text-[10px]', session.location === 'online' ? 'text-blue-400' : 'text-muted-foreground')}>
                      {session.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* At-Risk Students */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.47, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-risk/20 bg-risk/5 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-risk" />
                <h3 className="font-display font-bold text-foreground">Em risco</h3>
              </div>
              <span className="badge-risk">{atRisk.length} alunos</span>
            </div>
            <div className="space-y-3">
              {atRisk.map(student => {
                const dias = daysSince(student.lastSession);
                return (
                  <div key={student.id} className="flex items-center gap-3">
                    <div className="avatar size-9 text-xs shrink-0 bg-risk/10 text-risk">
                      {getInitials(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                      <div className="progress-bar mt-1.5">
                        <div
                          className="progress-bar-fill risk"
                          style={{ width: `${student.retentionScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-risk">{student.retentionScore}%</p>
                      <p className="text-[10px] text-muted-foreground">{dias}d sem treino</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.54, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">Alertas</h3>
              <a href="/alertas" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Ver todos <ChevronRight className="size-3" />
              </a>
            </div>
            <div className="space-y-2.5">
              {unreadAlerts.slice(0, 3).map(notif => (
                <div key={notif.id} className={cn(
                  'rounded-xl p-3 border',
                  notif.priority === 'high' ? 'border-risk/20 bg-risk/5' : 'border-border bg-muted/30'
                )}>
                  <div className="flex items-start gap-2">
                    {notif.type === 'streak' ? (
                      <Flame className="size-3.5 text-warning mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className={cn('size-3.5 mt-0.5 shrink-0', notif.priority === 'high' ? 'text-risk' : 'text-warning')} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{notif.studentName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
