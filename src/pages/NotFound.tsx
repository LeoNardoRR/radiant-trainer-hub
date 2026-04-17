import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-xs"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-black text-primary">404</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          A página <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{location.pathname}</code> não existe ou foi removida.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Voltar ao início
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
