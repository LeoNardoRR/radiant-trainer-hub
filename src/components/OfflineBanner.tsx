import { useState, useEffect } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[100] bg-risk text-white py-2 px-4 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg"
        >
          <WifiOff className="h-3.5 w-3.5" />
          <span>Você está offline. Algumas funções podem não funcionar.</span>
        </motion.div>
      )}
      {showRestored && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[100] bg-success text-white py-2 px-4 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg"
        >
          <Wifi className="h-3.5 w-3.5" />
          <span>Conexão restabelecida!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
