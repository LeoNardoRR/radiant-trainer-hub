import { motion } from "framer-motion";
import { X, Download, Printer, Share2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppIcon } from "./AppIcon";

interface ReceiptModalProps {
  payment: any;
  trainerName?: string;
  onClose: () => void;
}

export const ReceiptModal = ({ payment, trainerName, onClose }: ReceiptModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white text-slate-900 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Decora */}
        <div className="bg-slate-900 p-8 text-white flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
            <AppIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase">Recibo de Pagamento</h2>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">FitApp</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 relative">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
            <CheckCircle2 className="w-64 h-64" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Pago</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">R$ {Number(payment.amount).toFixed(2)}</p>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluno</span>
              <span className="text-sm font-bold text-slate-800">{payment.student?.full_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profissional</span>
              <span className="text-sm font-bold text-slate-800">{trainerName || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</span>
              <span className="text-sm font-bold text-slate-800">
                {payment.paid_at ? format(new Date(payment.paid_at), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referência</span>
              <span className="text-sm font-bold text-slate-800">{payment.reference_month || "Pagamento Avulso"}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">ID da Transação</p>
            <p className="text-[10px] font-mono text-slate-500 break-all uppercase">{payment.id}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 flex gap-2">
          <button className="flex-1 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm hover:bg-slate-800 transition-all active:scale-95">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => window.print()} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all active:scale-95">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
