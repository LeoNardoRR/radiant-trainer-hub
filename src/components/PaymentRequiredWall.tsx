import { motion } from "framer-motion";
import { CreditCard, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaymentRequiredWallProps {
  feature?: string;
}

/** Shown to students with overdue payment when trying to access restricted features */
const PaymentRequiredWall = ({ feature = "este recurso" }: PaymentRequiredWallProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-5">
        <CreditCard className="h-7 w-7 text-warning" strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-bold text-warning uppercase tracking-widest mb-2">
        Pagamento necessário
      </p>
      <h2 className="font-bold text-xl tracking-tight mb-2">
        Acesso temporariamente bloqueado
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        Você tem um pagamento atrasado que bloqueia o acesso a{" "}
        <span className="font-semibold text-foreground">{feature}</span>. Entre em
        contato com seu personal para regularizar.
      </p>
      <button
        onClick={() => navigate("/messages")}
        className="flex items-center gap-2 h-11 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors press-scale"
      >
        <MessageSquare className="h-4 w-4" />
        Falar com personal
      </button>
    </motion.div>
  );
};

export default PaymentRequiredWall;
