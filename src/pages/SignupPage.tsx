import { useState } from "react";
import { motion } from "framer-motion";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Dumbbell, User, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AppIcon } from "@/components/AppIcon";

const signupSchema = z.object({
  fullName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Insira um endereço de email válido"),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Pelo menos 1 letra maiúscula")
    .regex(/\d/, "Pelo menos 1 número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Pelo menos 1 caractere especial"),
  role: z.enum(["trainer", "student"]),
});

type SignupValues = z.infer<typeof signupSchema>;

const passwordRules = [
  { label: "Mínimo 8 caracteres",             test: (p: string) => p.length >= 8 },
  { label: "Pelo menos 1 número",             test: (p: string) => /\d/.test(p) },
  { label: "Pelo menos 1 letra maiúscula",    test: (p: string) => /[A-Z]/.test(p) },
  { label: "Pelo menos 1 caractere especial", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const inviteFromUrl = searchParams.get("invite") || "";
  const initialRole = (searchParams.get("role") === "student" || inviteFromUrl ? "student" : "trainer") as "trainer" | "student";
  
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: initialRole,
    },
  });

  const selectedRole = watch("role");
  const currentPassword = useWatch({ control, name: "password" }) || "";

  // Já logado? Vai pro dashboard direto
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: SignupValues) => {
    setIsLoading(true);
    try {
      await signUp(data.email.trim().toLowerCase(), data.password, data.fullName.trim(), data.role);
      toast.success("Conta criada! Verifique seu email para confirmar.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.message?.includes("already registered") ? "Este email já está cadastrado" : err.message;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordChecks = passwordRules.map((r) => ({ ...r, passed: r.test(currentPassword) }));

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col lg:flex-row overflow-y-auto">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/6 via-primary/3 to-background items-center justify-center p-12">
        <div className="max-w-sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5 mb-10">
            <AppIcon size="md" />
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
      <div className="flex-1 flex items-center justify-center p-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-5">
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <AppIcon size="sm" />
            <span className="text-[13px] font-semibold tracking-tight">FitApp</span>
          </div>
          <div>
            <h2 className="font-bold text-2xl tracking-tight mb-1.5">Criar conta</h2>
            <p className="text-[13px] text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setValue("role", "trainer")}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all min-h-[80px] ${
                  selectedRole === "trainer"
                    ? "border-primary bg-primary/6 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/20"
                }`}>
                <Dumbbell className="h-5 w-5" strokeWidth={selectedRole === "trainer" ? 2 : 1.5} />
                <span className="text-[12px] font-semibold">Personal Trainer</span>
                <span className="text-[10px] text-muted-foreground">Gerencie alunos</span>
              </button>
              <button type="button" onClick={() => setValue("role", "student")}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all min-h-[80px] ${
                  selectedRole === "student"
                    ? "border-[hsl(265,83%,57%)] bg-[hsl(265,83%,57%,0.06)] text-[hsl(265,83%,57%)]"
                    : "border-border bg-card text-muted-foreground hover:border-[hsl(265,83%,57%,0.2)]"
                }`}>
                <User className="h-5 w-5" strokeWidth={selectedRole === "student" ? 2 : 1.5} />
                <span className="text-[12px] font-semibold">Aluno</span>
                <span className="text-[10px] text-muted-foreground">Acompanhe treinos</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Nome completo</label>
                <Input
                  {...register("fullName")}
                  placeholder="Seu nome"
                  className={`h-12 ${errors.fullName ? "border-risk focus-visible:ring-risk" : ""}`}
                />
                {errors.fullName && <p className="text-[11px] text-risk mt-1">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  className={`h-12 ${errors.email ? "border-risk focus-visible:ring-risk" : ""}`}
                />
                {errors.email && <p className="text-[11px] text-risk mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha segura"
                    className={`h-12 pr-12 ${errors.password ? "border-risk focus-visible:ring-risk" : ""}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
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
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;

