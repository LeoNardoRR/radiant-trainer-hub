import { motion } from "framer-motion";
import { Calendar, Users, TrendingUp, AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stats = [
  { label: "Sessões esta semana", value: "24", icon: Calendar, change: "+3" },
  { label: "Taxa de presença", value: "92%", icon: TrendingUp, change: "+5%" },
  { label: "Alunos ativos", value: "18", icon: Users, change: "" },
  { label: "Em risco", value: "3", icon: AlertTriangle, change: "" },
];

const pendingRequests = [
  { id: 1, student: "Ana Silva", time: "Seg, 14:00", type: "Musculação", status: "pending" },
  { id: 2, student: "Carlos Mendes", time: "Ter, 08:00", type: "Funcional", status: "pending" },
  { id: 3, student: "Julia Santos", time: "Ter, 16:00", type: "Pilates", status: "pending" },
];

const alerts = [
  { message: "Maria Oliveira não treina há 5 dias", type: "warning" },
  { message: "Pedro Costa faltou 2x esta semana", type: "risk" },
  { message: "Lucas Ferreira completou 30 treinos consecutivos!", type: "success" },
];

const todaySessions = [
  { time: "07:00", student: "Roberto Lima", status: "completed" },
  { time: "08:00", student: "Fernanda Alves", status: "completed" },
  { time: "09:00", student: "Marcos Paulo", status: "current" },
  { time: "10:00", student: "Camila Torres", status: "upcoming" },
  { time: "14:00", student: "Ana Silva", status: "upcoming" },
  { time: "16:00", student: "Bruno Santos", status: "upcoming" },
];

const DashboardPage = () => {
  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <p className="text-editorial-sm text-muted-foreground mb-2">DASHBOARD</p>
          <h1 className="font-display font-light text-3xl md:text-4xl tracking-tight">
            Bom dia, Trainer
          </h1>
          <p className="font-body font-light text-muted-foreground mt-1">
            Terça-feira, 25 de março de 2026
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 1}
              className="bg-background p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <stat.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                {stat.change && (
                  <span className="text-editorial-sm text-success">{stat.change}</span>
                )}
              </div>
              <p className="font-display font-light text-3xl mb-1">{stat.value}</p>
              <p className="text-editorial-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
            className="lg:col-span-1 card-editorial"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-editorial-sm">AGENDA DE HOJE</p>
              <Link to="/schedule" className="text-editorial-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {todaySessions.map((session) => (
                <div
                  key={session.time + session.student}
                  className={`flex items-center gap-4 py-3 border-t border-border ${
                    session.status === "current" ? "bg-accent/30 -mx-4 px-4" : ""
                  }`}
                >
                  <span className="font-display text-sm w-14 shrink-0 text-muted-foreground">
                    {session.time}
                  </span>
                  <span className="font-body text-sm font-light flex-1">{session.student}</span>
                  {session.status === "completed" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
                  )}
                  {session.status === "current" && (
                    <span className="status-badge status-approved">Agora</span>
                  )}
                  {session.status === "upcoming" && (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={6}
            className="lg:col-span-1 card-editorial"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-editorial-sm">SOLICITAÇÕES PENDENTES</p>
              <span className="text-editorial-sm text-warning">{pendingRequests.length}</span>
            </div>
            <div className="space-y-0">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-4 border-t border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-body text-sm">{req.student}</p>
                      <p className="text-xs text-muted-foreground font-body font-light">
                        {req.time} · {req.type}
                      </p>
                    </div>
                    <span className="status-badge status-pending">Pendente</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 text-editorial-sm border border-success text-success hover:bg-success hover:text-success-foreground transition-colors duration-300">
                      Aprovar
                    </button>
                    <button className="flex-1 py-1.5 text-editorial-sm border border-border text-muted-foreground hover:border-risk hover:text-risk transition-colors duration-300">
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={7}
            className="lg:col-span-1 card-editorial"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-editorial-sm">ALERTAS INTELIGENTES</p>
              <Link to="/notifications" className="text-editorial-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 py-4 border-t border-border">
                  {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />}
                  {alert.type === "risk" && <XCircle className="h-4 w-4 text-risk shrink-0 mt-0.5" strokeWidth={1.5} />}
                  {alert.type === "success" && <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={1.5} />}
                  <p className="font-body font-light text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
