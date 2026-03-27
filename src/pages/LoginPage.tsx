import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message === "Invalid login credentials" ? "Email ou senha incorretos" : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-success/5 items-center justify-center p-12 border-r border-border">
        <div className="max-w-md">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-lg font-bold">F</span>
            </div>
            <span className="text-editorial-sm tracking-[0.15em]">APPFIT</span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display font-semibold text-5xl tracking-tight leading-[1.1] mb-4">
            Mais do que
            <br /><span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">uma agenda.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="font-body text-muted-foreground text-lg">
            Um sistema inteligente que faz seus alunos não desistirem.
          </motion.p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
        <motion.form onSubmit={handleSubmit} initial="hidden" animate="visible" variants={fadeUp} custom={0} className="w-full max-w-sm space-y-8">
          <div className="lg:hidden mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-editorial-sm tracking-[0.15em]">APPFIT</span>
          </div>
          <div>
            <h2 className="font-display font-semibold text-2xl tracking-tight mb-2">Entrar</h2>
            <p className="font-body text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta</Link>
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="font-body h-12 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="font-body h-12 rounded-lg" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-12 text-base">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
            ) : (
              <>Entrar<ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default LoginPage;
