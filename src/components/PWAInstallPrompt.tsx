import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { AppIcon } from "./AppIcon";

export const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");

    // Show after 10 seconds of first visit
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem("pwa_prompt_seen");
      if (!hasSeen) setShow(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_prompt_seen", "true");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[110] md:left-auto md:right-8 md:bottom-8 md:w-80"
        >
          <div className="bg-card border border-border shadow-2xl rounded-3xl p-5 overflow-hidden relative">
            <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 hover:bg-muted rounded-lg transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <AppIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold tracking-tight">Instalar Radiant Hub</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Adicione o app à sua tela inicial para acesso rápido e offline.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {platform === "ios" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-5 h-5 flex items-center justify-center bg-muted rounded-md text-[10px]">1</span>
                    Toque no ícone de compartilhar <Share className="h-3 w-3 text-primary inline" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-5 h-5 flex items-center justify-center bg-muted rounded-md text-[10px]">2</span>
                    Role e selecione "Adicionar à Tela de Início" <PlusSquare className="h-3.5 w-3.5 text-primary inline" />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => alert("Toque nos três pontos do navegador e selecione 'Instalar Aplicativo'.")}
                  className="w-full h-10 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Download className="h-4 w-4" /> Instalar Agora
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
