import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, MessageSquare } from "lucide-react";
import { useStudentAccess } from "@/hooks/useStudentAccess";
import { useNavigate } from "react-router-dom";

/** Sticky banner for students with an overdue payment */
const StudentPaymentBanner = () => {
  const { isOverdue, latestPayment, isLoading } = useStudentAccess();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (isLoading || !isOverdue || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-0 mb-4 rounded-2xl border border-warning/30 bg-warning/8 px-4 py-3 flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="h-4 w-4 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-warning">Pagamento atrasado</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {latestPayment?.payment_plans?.name
              ? `Plano "${latestPayment.payment_plans.name}" pendente.`
              : "Você tem um pagamento pendente."}{" "}
            Entre em contato com seu personal para regularizar.
          </p>
          <button
            onClick={() => navigate("/messages")}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-warning hover:text-warning/80 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            Falar com personal
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 hover:bg-warning/10 rounded-lg transition-colors shrink-0"
          aria-label="Dispensar"
        >
          <X className="h-3.5 w-3.5 text-warning/60" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentPaymentBanner;
