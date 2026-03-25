import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"trainer" | "student">("trainer");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 border-r border-border items-center justify-center p-12">
        <div className="max-w-md">
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-editorial-sm text-muted-foreground mb-6">
            FITFLOW
          </motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display font-light text-5xl tracking-tight leading-[1.1] mb-6">
            Profissionalize
            <br />
            seu serviço.
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="font-body font-light text-muted-foreground">
            7 dias grátis. Sem cartão de crédito.
          </motion.p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="w-full max-w-sm space-y-8">
          <div className="lg:hidden mb-10">
            <p className="text-editorial-sm tracking-[0.2em]">FITFLOW</p>
          </div>
          <div>
            <h2 className="font-display font-light text-2xl tracking-tight mb-2">Criar conta</h2>
            <p className="font-body font-light text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-foreground hover:underline">Entrar</Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="flex gap-[1px] bg-border">
            <button
              onClick={() => setRole("trainer")}
              className={`flex-1 py-3 text-editorial-sm transition-colors duration-300 ${
                role === "trainer" ? "bg-foreground text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Personal Trainer
            </button>
            <button
              onClick={() => setRole("student")}
              className={`flex-1 py-3 text-editorial-sm transition-colors duration-300 ${
                role === "student" ? "bg-foreground text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Aluno
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Nome completo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mínimo 8 caracteres" className="font-body font-light" />
            </div>
          </div>
          <Link to="/dashboard">
            <Button className="w-full text-editorial-sm py-5 mt-4">
              Criar conta
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-center text-xs font-body text-muted-foreground">
            Ao criar conta, você concorda com os{" "}
            <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>{" "}
            e{" "}
            <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
