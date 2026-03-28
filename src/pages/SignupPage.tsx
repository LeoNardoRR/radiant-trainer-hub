import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Dumbbell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"trainer" | "student">(
    searchParams.get("role") === "student" ? "student" : "trainer"
  );
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, name, role);
      toast.success("Conta criada com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
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
            Profissionalize
            <br /><span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">seu serviço.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="font-body text-muted-foreground text-lg">
            7 dias grátis. Sem cartão de crédito.
          </motion.p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
        <motion.form onSubmit={handleSubmit} initial="hidden" animate="visible" variants={fadeUp} custom={0} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-editorial-sm tracking-[0.15em]">APPFIT</span>
          </div>
          <div>
            <h2 className="font-display font-semibold text-2xl tracking-tight mb-2">Criar conta</h2>
            <p className="font-body text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole("trainer")}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 min-h-[80px] ${
                role === "trainer"
                  ? "border-[hsl(168,80%,36%)] bg-[hsl(168,80%,36%,0.08)] text-[hsl(168,80%,36%)]"
                  : "border-border bg-card text-muted-foreground hover:border-[hsl(168,80%,36%,0.3)]"
              }`}>
              <Dumbbell className="h-5 w-5" strokeWidth={role === "trainer" ? 2.2 : 1.5} />
              <span className="text-xs font-display font-medium">Personal Trainer</span>
              <span className="text-[10px] text-muted-foreground">Gerencie alunos</span>
            </button>
            <button type="button" onClick={() => setRole("student")}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 min-h-[80px] ${
                role === "student"
                  ? "border-[hsl(230,70%,55%)] bg-[hsl(230,70%,55%,0.08)] text-[hsl(230,70%,55%)]"
                  : "border-border bg-card text-muted-foreground hover:border-[hsl(230,70%,55%,0.3)]"
              }`}>
              <User className="h-5 w-5" strokeWidth={role === "student" ? 2.2 : 1.5} />
              <span className="text-xs font-display font-medium">Aluno</span>
              <span className="text-[10px] text-muted-foreground">Agende sessões</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Nome completo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="font-body h-12 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="font-body h-12 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mínimo 6 caracteres" className="font-body h-12 rounded-lg" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-12 text-base">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</>
            ) : (
              <>Criar conta<ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
          <p className="text-center text-xs font-body text-muted-foreground">
            Ao criar conta, você concorda com os Termos e Política de Privacidade
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default SignupPage;
