import { motion } from "framer-motion";
import { ArrowRight, Calendar, Bell, Users, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.25, 1, 0.5, 1] }
  })
};

const features = [
  { icon: Calendar, title: "Agendamento Inteligente", description: "Seus alunos solicitam, você aprova. Controle total da sua agenda." },
  { icon: Bell, title: "Retenção Automática", description: "O sistema detecta alunos em risco e age antes que desistam." },
  { icon: Users, title: "Gestão de Alunos", description: "Perfil completo, histórico, frequência e status em tempo real." },
  { icon: BarChart3, title: "Analytics", description: "Visualize taxa de presença, retenção e horários mais utilizados." },
  { icon: Shield, title: "Seguro & Confiável", description: "Autenticação robusta, dados protegidos e conformidade com LGPD." },
  { icon: Zap, title: "Mobile-First", description: "Interface nativa, carregamento instantâneo, poucos cliques." }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-[13px] font-display font-semibold tracking-tight">FitApp</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Planos</a>
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
      <section className="pt-28 pb-16 md:pt-40 md:pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 text-primary text-[11px] font-semibold mb-6 border border-primary/10">
            <Zap className="h-3 w-3" />
            PARA PERSONAL TRAINERS
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display font-bold text-[2.5rem] md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-5">
            Gerencie sua agenda.
            <br />
            <span className="text-primary">Retenha seus alunos.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Agendamento inteligente, aprovação manual e notificações de retenção.
            Substitua WhatsApp e planilhas.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="px-8 text-[15px]">
                Começar grátis
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-8 text-[15px]">
                Conhecer recursos
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {[
            { value: "97%", label: "Retenção" },
            { value: "3x", label: "Mais agendamentos" },
            { value: "< 30s", label: "Para agendar" }
          ].map((stat, i) =>
            <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="text-center py-6 px-4 rounded-2xl bg-card border border-border">
              <p className="font-display font-bold text-3xl md:text-5xl mb-1 text-primary">{stat.value}</p>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
              Tudo que você precisa.
            </h2>
            <p className="text-muted-foreground mt-3 text-base">Nada que você não precisa.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) =>
              <motion.div key={feature.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="bg-card border border-border rounded-2xl p-6 group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/3 transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-semibold text-[15px] mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">Simples por natureza</h2>
          </motion.div>
          <div className="space-y-0">
            {[
              { step: "1", title: "Aluno solicita", desc: "Escolhe horário disponível na sua agenda e envia solicitação." },
              { step: "2", title: "Você aprova", desc: "Com um toque, aprove ou sugira um novo horário." },
              { step: "3", title: "Sistema retém", desc: "Notificações inteligentes mantêm seus alunos engajados." }
            ].map((item, i) =>
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-5 py-7 border-t border-border">
                <span className="font-display font-bold text-2xl text-primary w-8 shrink-0">{item.step}</span>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-0.5">{item.title}</h3>
                  <p className="text-[14px] text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">Planos acessíveis</h2>
            <p className="text-muted-foreground mt-3 text-base">Ganhe por quantidade. Preço justo para todos.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Starter", price: "Grátis", period: "",
                features: ["Até 5 alunos", "Agendamento básico", "Notificações padrão", "Chat integrado"],
                cta: "Começar grátis", highlighted: false
              },
              {
                name: "Pro", price: "R$4,90", period: "/mês",
                features: ["Alunos ilimitados", "Motor de retenção", "Analytics completo", "Suporte prioritário"],
                cta: "Assinar agora", highlighted: true
              },
              {
                name: "Business", price: "R$7,90", period: "/mês",
                features: ["Tudo do Pro", "Múltiplas unidades", "White-label", "Gerente dedicado"],
                cta: "Falar com vendas", highlighted: false
              }
            ].map((plan, i) =>
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className={`rounded-2xl p-6 flex flex-col border ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/15"
                    : "bg-card border-border"
                }`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide mb-5 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.name}</p>
                <div className="mb-5">
                  <span className="font-display font-bold text-3xl">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) =>
                    <li key={f} className={`text-[13px] flex items-center gap-2 ${plan.highlighted ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.highlighted ? "bg-primary-foreground/50" : "bg-primary"}`} />
                      {f}
                    </li>
                  )}
                </ul>
                <Link to="/signup">
                  <Button
                    variant={plan.highlighted ? "secondary" : "outline"}
                    className={`w-full ${plan.highlighted ? "bg-white text-primary hover:bg-white/90" : ""}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="font-display font-bold text-3xl md:text-6xl tracking-tight mb-5">
          Pronto para começar?
        </motion.h2>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
          Crie sua conta gratuita e comece a gerenciar seus alunos hoje.
        </motion.p>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
          <Link to="/signup">
            <Button size="lg" className="px-10 text-[15px]">
              Começar agora
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">F</span>
            </div>
            <span className="text-[13px] font-display font-semibold tracking-tight">FitApp</span>
          </div>
          <p className="text-[12px] text-muted-foreground">© 2026 FitApp. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
