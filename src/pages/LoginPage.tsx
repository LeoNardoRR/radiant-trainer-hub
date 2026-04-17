import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AppIcon } from "@/components/AppIcon";

const loginSchema = z.object({
  email: z.string().email("Insira um endereço de email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [showPassword, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Já logado? Vai pro dashboard direto
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email.trim().toLowerCase(), data.password);
      navigate("/dashboard", { replace: true });
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
            <AppIcon size="md" />
            <span className="text-[15px] font-bold tracking-tight">FitApp</span>
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-7"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <AppIcon size="sm" />
            <span className="text-[13px] font-bold tracking-tight">FitApp</span>
          </div>

          <div>
            <h2 className="font-black text-2xl tracking-tight mb-1.5">Entrar</h2>
            <p className="text-[13px] text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary font-bold hover:underline">Criar conta</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  className={`h-12 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-12 pr-12 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPassword)}
                    className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
                )}
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-13 text-[15px] py-3 mt-4">
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
                : <>Entrar<ArrowRight className="ml-1.5 h-4 w-4" /></>
              }
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;

