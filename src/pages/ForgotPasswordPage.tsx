import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppIcon } from "@/components/AppIcon";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ForgotPasswordPage = () => {
  const [email, setEmail]         = useState("");
  const [touched, setTouched]     = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent]           = useState(false);

  const emailValid = emailRegex.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) { toast.error("Insira um email válido"); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <AppIcon size="sm" />
          <span className="text-[13px] font-bold tracking-tight">FitApp</span>
        </div>

        {sent ? (
          /* ── Success state ───────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-black text-2xl tracking-tight mb-2">Email enviado!</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Verifique sua caixa de entrada em{" "}
              <strong className="text-foreground">{email}</strong> e clique no
              link para redefinir sua senha.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Não recebeu? Verifique a pasta de spam ou{" "}
              <button
                onClick={() => setSent(false)}
                className="text-primary font-bold hover:underline"
              >
                tente novamente
              </button>
              .
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full h-12">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* ── Form ─────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="space-y-7" noValidate>
            <div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao login
              </Link>
              <h1 className="font-black text-2xl tracking-tight mb-1.5">
                Esqueci minha senha
              </h1>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Insira seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  type="email"
                  placeholder="seu@email.com"
                  className={`h-12 pl-10 ${touched && email && !emailValid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>
              {touched && email && !emailValid && (
                <p className="text-[11px] text-destructive mt-1">Insira um email válido.</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 text-[15px]">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
