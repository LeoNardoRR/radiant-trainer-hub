import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
      {/* Left — clean gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/6 via-primary/3 to-background items-center justify-center p-12">
        <div className="max-w-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display text-lg font-bold">F</span>
            </div>
            <span className="text-[15px] font-display font-semibold tracking-tight">FitFlow</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="font-display font-bold text-4xl tracking-tight leading-[1.1] mb-3">
            Bem-vindo
            <br />de volta.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie seus alunos e mantenha sua agenda organizada.
          </motion.p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-7">
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-[13px] font-display font-semibold tracking-tight">FitFlow</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight mb-1.5">Entrar</h2>
            <p className="text-[13px] text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Criar conta</Link>
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="h-12" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="h-12" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-12 text-[15px]">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
            ) : (
              <>Entrar<ArrowRight className="ml-1.5 h-4 w-4" /></>
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default LoginPage;
