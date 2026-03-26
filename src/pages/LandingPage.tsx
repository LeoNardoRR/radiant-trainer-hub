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
{
  icon: Calendar,
  title: "Agendamento Inteligente",
  description: "Seus alunos solicitam, você aprova. Controle total da sua agenda."
},
{
  icon: Bell,
  title: "Notificações de Retenção",
  description: "O sistema detecta alunos em risco e age antes que desistam."
},
{
  icon: Users,
  title: "Gestão de Alunos",
  description: "Perfil completo, histórico, frequência e status em tempo real."
},
{
  icon: BarChart3,
  title: "Analytics Avançado",
  description: "Visualize taxa de presença, retenção e horários mais utilizados."
},
{
  icon: Shield,
  title: "Seguro & Confiável",
  description: "Autenticação robusta, dados protegidos e conformidade com LGPD."
},
{
  icon: Zap,
  title: "Performance Mobile",
  description: "Interface mobile-first, carregamento instantâneo, poucos cliques."
}];


const pricing = [
{
  name: "Starter",
  price: "Grátis",
  period: "",
  features: ["Até 5 alunos", "Agendamento básico", "Notificações padrão", "Dashboard simplificado"],
  cta: "Começar grátis",
  highlighted: false
},
{
  name: "Pro",
  price: "R$49",
  period: "/mês",
  features: [
  "Alunos ilimitados",
  "Motor de retenção IA",
  "Analytics completo",
  "Mensagens automáticas",
  "Suporte prioritário"],

  cta: "Teste 7 dias grátis",
  highlighted: true
},
{
  name: "Business",
  price: "R$79",
  period: "/mês",
  features: [
  "Tudo do Pro",
  "Múltiplas unidades",
  "API personalizada",
  "White-label",
  "Gerente dedicado"],

  cta: "Falar com vendas",
  highlighted: false
}];


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-editorial-sm tracking-[0.2em]">
            APPFIT
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-editorial-sm">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-editorial-sm">
                Criar conta
              </Button>
            </Link>
          </div>
          <Link to="/login" className="md:hidden">
            <Button size="sm" variant="ghost" className="text-editorial-sm">
              Entrar
            </Button>
          </Link>
        </div>
        <div className="line-thin" />
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="text-editorial-sm text-muted-foreground mb-8">
            
            PARA PERSONAL TRAINERS
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-display font-light text-4xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8">
            
            Mais do que uma agenda.
            <br />
            <span className="text-muted-foreground">
              Um sistema que faz seus alunos não desistirem.
            </span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="font-body font-light text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12">
            
            Agendamento inteligente, aprovação manual e notificações de retenção.
            Substitua WhatsApp, planilhas e controles manuais.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            
            <Link to="/signup">
              <Button size="lg" className="text-editorial-sm px-10 py-6">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-editorial-sm px-10 py-6">
                Conhecer recursos
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <div className="line-thin max-w-7xl mx-auto" />

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
          { value: "97%", label: "Taxa de retenção" },
          { value: "3x", label: "Mais agendamentos" },
          { value: "< 30s", label: "Para agendar" }].
          map((stat, i) =>
          <motion.div
            key={stat.label}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={i}>
            
              <p className="font-display font-light text-5xl md:text-6xl mb-2">{stat.value}</p>
              <p className="text-editorial-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          )}
        </div>
      </section>

      <div className="line-thin max-w-7xl mx-auto" />

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-editorial-sm text-muted-foreground mb-4 text-center">
            
            RECURSOS
          </motion.p>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="font-display font-light text-3xl md:text-5xl text-center mb-20 tracking-tight">
            
            Tudo que você precisa.
            <br />
            <span className="text-muted-foreground">Nada que você não precisa.</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-border">
            {features.map((feature, i) =>
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="bg-background p-10 group hover:bg-accent/50 transition-colors duration-500">
              
                <feature.icon className="h-5 w-5 text-muted-foreground mb-6 group-hover:text-foreground transition-colors duration-500" strokeWidth={1} />
                <h3 className="font-display text-lg mb-3 tracking-tight">{feature.title}</h3>
                <p className="font-body font-light text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="line-thin max-w-7xl mx-auto" />

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-editorial-sm text-muted-foreground mb-4 text-center">
            
            COMO FUNCIONA
          </motion.p>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="font-display font-light text-3xl md:text-5xl text-center mb-20 tracking-tight">
            
            Simples por natureza
          </motion.h2>
          <div className="space-y-0">
            {[
            { step: "01", title: "Aluno solicita", desc: "Escolhe horário disponível na sua agenda e envia solicitação." },
            { step: "02", title: "Você aprova", desc: "Com um clique, aprove ou sugira um novo horário." },
            { step: "03", title: "Sistema retém", desc: "Notificações inteligentes mantêm seus alunos engajados." }].
            map((item, i) =>
            <motion.div
              key={item.step}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="flex gap-8 py-10 border-t border-border">
              
                <span className="font-display font-light text-4xl text-muted-foreground/30 shrink-0 w-16">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-display text-xl mb-2">{item.title}</h3>
                  <p className="font-body font-light text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="line-thin max-w-7xl mx-auto" />

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-editorial-sm text-muted-foreground mb-4 text-center">
            
            PLANOS
          </motion.p>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="font-display font-light text-3xl md:text-5xl text-center mb-20 tracking-tight">
            
            Invista no seu negócio
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border">
            {pricing.map((plan, i) =>
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className={`bg-background p-10 flex flex-col ${plan.highlighted ? "bg-foreground text-primary-foreground" : ""}`}>
              
                <p className="text-editorial-sm mb-8 opacity-60">{plan.name}</p>
                <div className="mb-8">
                  <span className="font-display font-light text-4xl">{plan.price}</span>
                  <span className="text-sm opacity-50">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((f) =>
                <li key={f} className="text-sm font-body font-light opacity-70">
                      {f}
                    </li>
                )}
                </ul>
                <Link to="/signup">
                  <Button
                  variant={plan.highlighted ? "secondary" : "outline"}
                  className="w-full text-editorial-sm">
                  
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <div className="line-thin max-w-7xl mx-auto" />

      {/* CTA */}
      <section className="py-32 px-6 text-center">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="font-display font-light text-3xl md:text-6xl tracking-tight mb-6">
          
          Pronto para transformar
          <br />
          <span className="text-muted-foreground">seu negócio?</span>
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}>
          
          <Link to="/signup">
            <Button size="lg" className="text-editorial-sm px-12 py-6 mt-8">
              Começar agora — é grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-editorial-sm tracking-[0.2em]">APPFIT</p>
          <p className="text-xs font-body text-muted-foreground">
            © 2026 APPFIT. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </a>
            <a href="#" className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
              Termos
            </a>
          </div>
        </div>
      </footer>
    </div>);

};

export default LandingPage;