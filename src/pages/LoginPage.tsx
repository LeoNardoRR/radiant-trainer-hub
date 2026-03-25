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

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 border-r border-border items-center justify-center p-12">
        <div className="max-w-md">
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-editorial-sm text-muted-foreground mb-6">
            FITFLOW
          </motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display font-light text-5xl tracking-tight leading-[1.1] mb-6">
            Mais do que
            <br />
            uma agenda.
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="font-body font-light text-muted-foreground">
            Um sistema inteligente que faz seus alunos não desistirem.
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
            <h2 className="font-display font-light text-2xl tracking-tight mb-2">Entrar</h2>
            <p className="font-body font-light text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/signup" className="text-foreground hover:underline">Criar conta</Link>
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="font-body font-light" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="font-body font-light" />
            </div>
          </div>
          <Link to="/dashboard">
            <Button className="w-full text-editorial-sm py-5 mt-4">
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-center text-xs font-body text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Esqueceu a senha?</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
