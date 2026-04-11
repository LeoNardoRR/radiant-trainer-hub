import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LEN = 6;

const LoginPage = () => {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPass]   = useState(false);
  const [touched, setTouched]         = useState({ email: false, password: false });
  const [isLoading, setIsLoading]     = useState(false);
  const { signIn, user, loading } = useAuth();

  // Já logado? Vai pro dashboard direto
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const emailValid    = emailRegex.test(email);
  const passwordValid = password.length >= MIN_PASSWORD_LEN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!emailValid)     { toast.error("Insira um email válido"); return; }
    if (!passwordValid)  { toast.error(`A senha deve ter pelo menos ${MIN_PASSWORD_LEN} caracteres`); return; }

    setIsLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // window.location.replace => full reload com sessão já nos cookies
      // Evita race condition onde ProtectedRoute ainda vê user=null
      // logo após signIn() resolver mas antes do onAuthStateChange disparar.
      window.location.replace("/dashboard");
    } catch (err: any) {
      toast.error(
        err.message?.includes("Invalid login credentials")
          ? "Email ou senha incorretos"
          : (err.message ?? "Erro ao entrar")
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col lg:flex-row overflow-y-auto">
      {/* Left panel — desktop só */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/8 via-primary/3 to-background items-center justify-center p-12">
        <div className="max-w-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-lg">FT</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight">FitTracker</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="font-black text-4xl tracking-tight leading-[1.1] mb-3">
            Bem-vindo<br />de volta.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie seus alunos e mantenha sua agenda organizada.
          </motion.p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 py-10">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-7"
          noValidate
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">FT</span>
            </div>
            <span className="text-[13px] font-bold tracking-tight">FitTracker</span>
          </div>

          <div>
            <h2 className="font-black text-2xl tracking-tight mb-1.5">Entrar</h2>
            <p className="text-[13px] text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary font-bold hover:underline">Criar conta</Link>
            </p>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                type="email"
                placeholder="seu@email.com"
                className={`h-12 ${touched.email && email && !emailValid ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {touched.email && email && !emailValid && (
                <p className="text-[11px] text-destructive mt-1">Insira um email válido.</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Senha</label>
              <div className="relative">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`h-12 pr-12 ${touched.password && !passwordValid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPassword)}
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && !passwordValid && (
                <p className="text-[11px] text-destructive mt-1">Mínimo {MIN_PASSWORD_LEN} caracteres.</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-13 text-[15px] py-3">
            {isLoading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
              : <>Entrar<ArrowRight className="ml-1.5 h-4 w-4" /></>
            }
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default LoginPage;
