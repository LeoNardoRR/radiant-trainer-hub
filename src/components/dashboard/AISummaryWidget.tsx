import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, AlertCircle, TrendingUp, Calendar } from "lucide-react";

interface AISummaryProps {
  trainerName?: string;
  stats: {
    sessionsToday: number;
    atRiskCount: number;
    pendingRequests: number;
  };
}

export const AISummaryWidget = ({ trainerName, stats }: AISummaryProps) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-3xl p-5 shadow-xl shadow-indigo-500/20 overflow-hidden group"
        >
          {/* Animated Background Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-12 -mb-12" />

          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Resumo da Inteligência</p>
                <button onClick={() => setIsVisible(false)} className="text-white/40 hover:text-white transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm leading-snug">
                  Olá {trainerName?.split(' ')[0]}, você tem {stats.sessionsToday} sessões hoje. 
                  {stats.atRiskCount > 0 && ` ${stats.atRiskCount} alunos estão em risco de evasão.`}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                    <Calendar className="h-3 w-3 text-white/80" />
                    <span className="text-[10px] font-bold text-white/90">{stats.sessionsToday} aulas</span>
                  </div>
                  {stats.atRiskCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-risk/20 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-risk/30">
                      <AlertCircle className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-bold text-white">{stats.atRiskCount} alertas</span>
                    </div>
                  )}
                  {stats.pendingRequests > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                      <TrendingUp className="h-3 w-3 text-white/80" />
                      <span className="text-[10px] font-bold text-white/90">{stats.pendingRequests} solicitações</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
