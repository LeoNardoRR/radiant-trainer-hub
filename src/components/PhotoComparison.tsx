import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ProgressPhoto } from "@/hooks/useProgressPhotos";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PhotoComparisonProps {
  photos: ProgressPhoto[];
}

export const PhotoComparison = ({ photos }: PhotoComparisonProps) => {
  const [beforeIdx, setBeforeIdx] = useState(photos.length - 1);
  const [afterIdx, setAfterIdx] = useState(0);

  if (photos.length < 2) {
    return (
      <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground font-medium">
          Adicione pelo menos duas fotos para comparar sua evolução.
        </p>
      </div>
    );
  }

  const before = photos[beforeIdx];
  const after = photos[afterIdx];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Comparação Visual</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Before */}
        <div className="space-y-2">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border">
            <img src={before.photo_url} alt="Antes" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
              Antes
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => setBeforeIdx(prev => Math.min(photos.length - 1, prev + 1))}
              disabled={beforeIdx === photos.length - 1}
              className="p-1 disabled:opacity-20"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-[10px] font-bold text-muted-foreground">
              {format(parseISO(before.captured_at), "dd/MM/yy", { locale: ptBR })}
            </span>
            <button 
              onClick={() => setBeforeIdx(prev => Math.max(0, prev - 1))}
              disabled={beforeIdx === 0}
              className="p-1 disabled:opacity-20"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border">
            <img src={after.photo_url} alt="Depois" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
              Depois
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <button 
              onClick={() => setAfterIdx(prev => Math.min(photos.length - 1, prev + 1))}
              disabled={afterIdx === photos.length - 1}
              className="p-1 disabled:opacity-20"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-[10px] font-bold text-muted-foreground">
              {format(parseISO(after.captured_at), "dd/MM/yy", { locale: ptBR })}
            </span>
            <button 
              onClick={() => setAfterIdx(prev => Math.max(0, prev - 1))}
              disabled={afterIdx === 0}
              className="p-1 disabled:opacity-20"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
        <p className="text-xs font-bold text-primary">
          Evolução de {formatDistanceToNow(parseISO(before.captured_at), parseISO(after.captured_at))}
        </p>
      </div>
    </div>
  );
};

function formatDistanceToNow(d1: Date, d2: Date) {
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays < 30) return `${diffDays} dias`;
    if (diffDays < 365) return `${Math.floor(diffDays/30)} meses`;
    return `${Math.floor(diffDays/365)} anos`;
}
