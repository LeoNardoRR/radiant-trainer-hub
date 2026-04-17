import { motion } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { MOCK_STUDENTS, RETENTION_CHART_DATA, formatCurrency, getInitials, daysSince } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const RADAR_DATA = [
  { metric: 'Assiduidade', value: 78 },
  { metric: 'Pontualidade', value: 85 },
  { metric: 'Engajamento', value: 62 },
  { metric: 'Renovação', value: 90 },
  { metric: 'Indicações', value: 45 },
  { metric: 'Satisfação', value: 88 },
];

const CHURN_RISK_DATA = MOCK_STUDENTS
  .sort((a, b) => a.retentionScore - b.retentionScore)
  .map(s => ({
    name: s.name.split(' ')[0],
    score: s.retentionScore,
    value: s.monthlyValue,
    dias: daysSince(s.lastSession) ?? 0,
  }));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl text-xs">
      <p className="font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold text-foreground">{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

export function Retention() {
  const avgRetention = Math.round(MOCK_STUDENTS.reduce((a, s) => a + s.retentionScore, 0) / MOCK_STUDENTS.length);
  const atRiskRevenue = MOCK_STUDENTS.filter(s => s.status === 'at_risk').reduce((a, s) => a + s.monthlyValue, 0);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Análise de Retenção"
        subtitle="Identifique padrões e evite cancelamentos"
      />

      <div className="flex-1 p-6 space-y-5">
        {/* Top KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Retenção média', value: `${avgRetention}%`, sub: 'Score geral dos alunos', color: 'text-primary' },
            { label: 'Em risco de churn', value: `${MOCK_STUDENTS.filter(s => s.status === 'at_risk').length}`, sub: 'Alunos sem sessão recente', color: 'text-risk' },
            { label: 'Receita em risco', value: formatCurrency(atRiskRevenue), sub: 'Potencial perda mensal', color: 'text-warning' },
            { label: 'NPS estimado', value: '72', sub: 'Baseado em assiduidade', color: 'text-blue-400' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card"
            >
              <p className={cn('font-display text-2xl font-bold', kpi.color)}>{kpi.value}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Line chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="lg:col-span-3 rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-display font-bold text-foreground mb-4">Retenção ao longo do tempo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={RETENTION_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 18%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215 15% 55%)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'hsl(215 15% 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" stroke="hsl(142 71% 45%)" strokeWidth={2.5} dot={{ fill: 'hsl(142 71% 45%)', r: 3 }} name="Taxa" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Radar chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
          >
            <h3 className="font-display font-bold text-foreground mb-1">Perfil da carteira</h3>
            <p className="text-xs text-muted-foreground mb-3">Métricas de qualidade</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={RADAR_DATA} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="hsl(222 16% 18%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(215 15% 55%)' }} />
                <Radar dataKey="value" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Student risk table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="font-display font-bold text-foreground mb-4">Ranking de risco de churn</h3>
          <div className="space-y-3">
            {MOCK_STUDENTS.sort((a, b) => a.retentionScore - b.retentionScore).map((student, i) => (
              <div key={student.id} className="flex items-center gap-4">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <div className="avatar size-8 text-[10px] shrink-0">{getInitials(student.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{student.name}</span>
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      student.retentionScore < 50 ? 'bg-risk/10 text-risk' :
                      student.retentionScore < 70 ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    )}>
                      {student.retentionScore}%
                    </span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <div
                      className={cn('progress-bar-fill',
                        student.retentionScore < 50 ? 'risk' :
                        student.retentionScore < 70 ? 'warning' : ''
                      )}
                      style={{ width: `${student.retentionScore}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">{formatCurrency(student.monthlyValue)}/mês</p>
                  <p className="text-[10px] text-muted-foreground">
                    {student.lastSession ? `${daysSince(student.lastSession)}d sem treino` : 'Sem treinos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
