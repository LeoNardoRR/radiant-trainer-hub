import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Dumbbell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const inviteFromUrl = searchParams.get("invite") || "";
  const [role, setRole] = useState<"trainer" | "student">(
    searchParams.get("role") === "student" || inviteFromUrl ? "student" : "trainer"
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/6 via-primary/3 to-background items-center justify-center p-12">
        <div className="max-w-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display text-lg font-bold">F</span>
            </div>
            <span className="text-[15px] font-display font-semibold tracking-tight">FitApp</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="font-display font-bold text-4xl tracking-tight leading-[1.1] mb-3">
            Profissionalize
            <br />seu serviço.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-muted-foreground text-[15px] leading-relaxed">
            7 dias grátis. Sem cartão de crédito.
          </motion.p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-6">
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-[13px] font-display font-semibold tracking-tight">FitApp</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight mb-1.5">Criar conta</h2>
            <p className="text-[13px] text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole("trainer")}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 min-h-[80px] ${
                role === "trainer"
                  ? "border-primary bg-primary/6 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/20"
              }`}>
              <Dumbbell className="h-5 w-5" strokeWidth={role === "trainer" ? 2 : 1.5} />
              <span className="text-[12px] font-semibold">Personal Trainer</span>
              <span className="text-[10px] text-muted-foreground">Gerencie alunos</span>
            </button>
            <button type="button" onClick={() => setRole("student")}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 min-h-[80px] ${
                role === "student"
                  ? "border-[hsl(265,83%,57%)] bg-[hsl(265,83%,57%,0.06)] text-[hsl(265,83%,57%)]"
                  : "border-border bg-card text-muted-foreground hover:border-[hsl(265,83%,57%,0.2)]"
              }`}>
              <User className="h-5 w-5" strokeWidth={role === "student" ? 2 : 1.5} />
              <span className="text-[12px] font-semibold">Aluno</span>
              <span className="text-[10px] text-muted-foreground">Agende sessões</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Nome completo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="h-12" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="h-12" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Senha</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mínimo 6 caracteres" className="h-12" />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-12 text-[15px]">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</>
            ) : (
              <>Criar conta<ArrowRight className="ml-1.5 h-4 w-4" /></>
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Ao criar conta, você concorda com os Termos e Política de Privacidade
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default SignupPage;
