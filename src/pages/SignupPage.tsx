import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Dumbbell, User, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const passwordRules = [
  { label: "Mínimo 6 caracteres", test: (p: string) => p.length >= 6 },
  { label: "Pelo menos 1 número", test: (p: string) => /\d/.test(p) },
  { label: "Pelo menos 1 letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
];

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const inviteFromUrl = searchParams.get("invite") || "";
  const [role, setRole] = useState<"trainer" | "student">(
    searchParams.get("role") === "student" || inviteFromUrl ? "student" : "trainer"
  );
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  // Já logado? Vai pro dashboard direto
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const emailValid = emailRegex.test(email);
  const passwordChecks = passwordRules.map((r) => ({ ...r, passed: r.test(password) }));
  const passwordValid = passwordChecks.every((c) => c.passed);
  const nameValid = name.trim().length >= 2;
  const canSubmit = nameValid && emailValid && passwordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!canSubmit) {
      if (!nameValid) toast.error("Insira seu nome completo");
      else if (!emailValid) toast.error("Insira um email válido");
      else toast.error("Corrija a senha antes de continuar");
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim(), role);
      toast.success("Conta criada! Verifique seu email para confirmar.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.message?.includes("already registered") ? "Este email já está cadastrado" : err.message;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col lg:flex-row">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/6 via-primary/3 to-background items-center justify-center p-12">
        <div className="max-w-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">FitApp</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="font-bold text-4xl tracking-tight leading-[1.1] mb-3">
            Profissionalize<br />seu serviço.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-muted-foreground text-[15px] leading-relaxed">
            7 dias grátis. Sem cartão de crédito.
          </motion.p>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-5" noValidate>
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="text-[13px] font-semibold tracking-tight">FitApp</span>
          </div>
          <div>
            <h2 className="font-bold text-2xl tracking-tight mb-1.5">Criar conta</h2>
            <p className="text-[13px] text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole("trainer")}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all min-h-[80px] ${
                role === "trainer"
                  ? "border-primary bg-primary/6 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/20"
              }`}>
              <Dumbbell className="h-5 w-5" strokeWidth={role === "trainer" ? 2 : 1.5} />
              <span className="text-[12px] font-semibold">Personal Trainer</span>
              <span className="text-[10px] text-muted-foreground">Gerencie alunos</span>
            </button>
            <button type="button" onClick={() => setRole("student")}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all min-h-[80px] ${
                role === "student"
                  ? "border-[hsl(265,83%,57%)] bg-[hsl(265,83%,57%,0.06)] text-[hsl(265,83%,57%)]"
                  : "border-border bg-card text-muted-foreground hover:border-[hsl(265,83%,57%,0.2)]"
              }`}>
              <User className="h-5 w-5" strokeWidth={role === "student" ? 2 : 1.5} />
              <span className="text-[12px] font-semibold">Aluno</span>
              <span className="text-[10px] text-muted-foreground">Acompanhe treinos</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Nome completo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(p => ({ ...p, name: true }))}
                placeholder="Seu nome" className={`h-12 ${touched.name && !nameValid ? "border-risk focus-visible:ring-risk" : ""}`} />
              {touched.name && !nameValid && <p className="text-[11px] text-risk mt-1">Insira pelo menos 2 caracteres.</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(p => ({ ...p, email: true }))}
                type="email" placeholder="seu@email.com" className={`h-12 ${touched.email && !emailValid && email ? "border-risk focus-visible:ring-risk" : ""}`} />
              {touched.email && email && !emailValid && <p className="text-[11px] text-risk mt-1">Insira um email válido.</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Senha</label>
              <div className="relative">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  type={showPassword ? "text" : "password"} placeholder="Crie uma senha segura"
                  className={`h-12 pr-12 ${touched.password && !passwordValid ? "border-risk focus-visible:ring-risk" : ""}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5">
                      {check.passed ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={`text-[11px] ${check.passed ? "text-success" : "text-muted-foreground"}`}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
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
