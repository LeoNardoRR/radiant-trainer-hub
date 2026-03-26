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
      <div className="hidden lg:flex lg:w-1/2 border-r border-border items-center justify-center p-12">
        <div className="max-w-md">
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-editorial-sm text-muted-foreground mb-6">
            FITFLOW
          </motion.p>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display font-light text-5xl tracking-tight leading-[1.1] mb-6">
            Mais do que
            <br />uma agenda.
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="font-body font-light text-muted-foreground">
            Um sistema inteligente que faz seus alunos não desistirem.
          </motion.p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
        <motion.form
          onSubmit={handleSubmit}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="w-full max-w-sm space-y-8"
        >
          <div className="lg:hidden mb-6">
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
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="font-body font-light h-12" />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground mb-1.5 block">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="font-body font-light h-12" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full text-editorial-sm py-5 h-12">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default LoginPage;
