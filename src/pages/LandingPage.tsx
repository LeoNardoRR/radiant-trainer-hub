import { motion } from "framer-motion";
import { ArrowRight, Calendar, Bell, Users, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  })
};

const features = [
  { icon: Calendar, title: "Agendamento Inteligente", description: "Seus alunos solicitam, você aprova. Controle total da sua agenda.", color: "text-primary" },
  { icon: Bell, title: "Notificações de Retenção", description: "O sistema detecta alunos em risco e age antes que desistam.", color: "text-warning" },
  { icon: Users, title: "Gestão de Alunos", description: "Perfil completo, histórico, frequência e status em tempo real.", color: "text-success" },
  { icon: BarChart3, title: "Analytics Avançado", description: "Visualize taxa de presença, retenção e horários mais utilizados.", color: "text-primary" },
  { icon: Shield, title: "Seguro & Confiável", description: "Autenticação robusta, dados protegidos e conformidade com LGPD.", color: "text-success" },
  { icon: Zap, title: "Performance Mobile", description: "Interface mobile-first, carregamento instantâneo, poucos cliques.", color: "text-warning" }
];

const pricing = [
  {
    name: "Starter", price: "Grátis", period: "",
    features: ["Até 5 alunos", "Agendamento básico", "Notificações padrão", "Dashboard simplificado"],
    cta: "Começar grátis", highlighted: false
  },
  {
    name: "Pro", price: "R$49", period: "/mês",
    features: ["Alunos ilimitados", "Motor de retenção IA", "Analytics completo", "Mensagens automáticas", "Suporte prioritário"],
    cta: "Teste 7 dias grátis", highlighted: true
  },
  {
    name: "Business", price: "R$79", period: "/mês",
    features: ["Tudo do Pro", "Múltiplas unidades", "API personalizada", "White-label", "Gerente dedicado"],
    cta: "Falar com vendas", highlighted: false
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-editorial-sm tracking-[0.15em]">APPFIT</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/signup"><Button size="sm">Criar conta</Button></Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/signup"><Button size="sm">Criar conta</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-44 md:pb-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-display font-medium mb-8">
            <Zap className="h-3.5 w-3.5" />
            PARA PERSONAL TRAINERS
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display font-semibold text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
            Mais do que uma agenda.
            <br />
            <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              Um sistema que retém seus alunos.
            </span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="font-body text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Agendamento inteligente, aprovação manual e notificações de retenção.
            Substitua WhatsApp, planilhas e controles manuais.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="px-10 py-6 text-base">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-10 py-6 text-base">
                Conhecer recursos
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { value: "97%", label: "Taxa de retenção", color: "text-primary" },
            { value: "3x", label: "Mais agendamentos", color: "text-success" },
            { value: "< 30s", label: "Para agendar", color: "text-warning" }
          ].map((stat, i) =>
            <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="text-center p-6 rounded-xl bg-card border border-border">
              <p className={`font-display font-bold text-5xl md:text-6xl mb-2 ${stat.color}`}>{stat.value}</p>
              <p className="text-editorial-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-display font-medium mb-4">
              RECURSOS
            </span>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight">
              Tudo que você precisa.
              <br />
              <span className="text-muted-foreground">Nada que você não precisa.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) =>
              <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-card border border-border rounded-xl p-8 group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-xs font-display font-medium mb-4">
              COMO FUNCIONA
            </span>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight">Simples por natureza</h2>
          </motion.div>
          <div className="space-y-0">
            {[
              { step: "01", title: "Aluno solicita", desc: "Escolhe horário disponível na sua agenda e envia solicitação.", color: "text-primary bg-primary/10" },
              { step: "02", title: "Você aprova", desc: "Com um clique, aprove ou sugira um novo horário.", color: "text-success bg-success/10" },
              { step: "03", title: "Sistema retém", desc: "Notificações inteligentes mantêm seus alunos engajados.", color: "text-warning bg-warning/10" }
            ].map((item, i) =>
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-6 py-8 border-t border-border">
                <span className={`font-display font-bold text-lg w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  {item.step}
                </span>
                <div>
                  <h3 className="font-display font-semibold text-xl mb-1">{item.title}</h3>
                  <p className="font-body text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-display font-medium mb-4">
              PLANOS
            </span>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight">Invista no seu negócio</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricing.map((plan, i) =>
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className={`rounded-xl p-8 flex flex-col border ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                    : "bg-card border-border"
                }`}>
                <p className={`text-editorial-sm mb-6 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.name}</p>
                <div className="mb-6">
                  <span className="font-display font-bold text-4xl">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) =>
                    <li key={f} className={`text-sm font-body flex items-center gap-2 ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.highlighted ? "bg-primary-foreground/50" : "bg-primary"}`} />
                      {f}
                    </li>
                  )}
                </ul>
                <Link to="/signup">
                  <Button
                    variant={plan.highlighted ? "secondary" : "outline"}
                    className={`w-full ${plan.highlighted ? "bg-white text-primary hover:bg-white/90 font-semibold" : ""}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="font-display font-semibold text-3xl md:text-6xl tracking-tight mb-6">
          Pronto para transformar
          <br />
          <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">seu negócio?</span>
        </motion.h2>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
          <Link to="/signup">
            <Button size="lg" className="px-12 py-6 text-base mt-4">
              Começar agora — é grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-xs font-bold">F</span>
            </div>
            <span className="text-editorial-sm tracking-[0.15em]">APPFIT</span>
          </div>
          <p className="text-xs font-body text-muted-foreground">© 2026 APPFIT. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
