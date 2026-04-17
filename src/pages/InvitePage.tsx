/**
 * InvitePage — /invite/:code
 *
 * Rota pública que o aluno acessa ao clicar no link de convite.
 * Redireciona direto para o signup com o código pré-preenchido.
 */
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

const InvitePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Pequeno delay para mostrar a animação de boas-vindas
    const t = setTimeout(() => {
      navigate(`/signup?role=student&invite=${code ?? ""}`, { replace: true });
    }, 1800);
    return () => clearTimeout(t);
  }, [code, navigate]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl mb-6"
      >
        <img src="/icon-192.png" alt="FitApp" className="w-full h-full object-cover" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-black tracking-tight mb-2">
          Você foi convidado!
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          Seu personal te convidou para o FitApp. Criando sua conta em segundos…
        </p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-1.5 mt-8"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>

      {/* Code chip */}
      {code && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 px-4 py-2 bg-muted rounded-full text-xs font-bold text-muted-foreground"
        >
          Código: {code}
        </motion.div>
      )}
    </div>
  );
};

export default InvitePage;
