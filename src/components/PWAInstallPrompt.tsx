import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { AppIcon } from "./AppIcon";
import { toast } from "sonner";

export const PWAInstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // On localhost, always show for easier testing
      const isLocal = window.location.hostname === "localhost";
      const hasSeen = localStorage.getItem("pwa_prompt_seen");
      if (!hasSeen || isLocal) setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");

    // Force show after a few seconds if not seen, regardless of event (fallback)
    const timer = setTimeout(() => {
      const isLocal = window.location.hostname === "localhost";
      const hasSeen = localStorage.getItem("pwa_prompt_seen");
      if (!hasSeen || isLocal) setShow(true);
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Para instalar, toque nos 3 pontinhos do navegador e escolha 'Instalar Aplicativo'.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

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
            <div className="shrink-0">
              <AppIcon size="lg" />
            </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold tracking-tight">Instalar FitApp</p>
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
                  onClick={handleInstallClick}
                  className="w-full h-12 bg-primary text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  <Download className="h-4 w-4" /> 
                  Instalar Agora
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
