import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, 
  CheckCircle2, Timer as TimerIcon, Info, Dumbbell 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Exercise {
  id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  weight_kg: number;
  rest_seconds: number;
  technical_notes?: string;
  video_url?: string;
}

interface WorkoutPlayerProps {
  planName: string;
  exercises: Exercise[];
  onClose: (completed: boolean) => void;
}

export const WorkoutPlayer = ({ planName, exercises, onClose }: WorkoutPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [showRest, setShowRest] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  
  const currentEx = exercises[currentIndex];
  
  // Workout timer
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Rest timer
  useEffect(() => {
    let interval: any;
    if (showRest && restSeconds > 0) {
      interval = setInterval(() => setRestSeconds(s => s - 1), 1000);
    } else if (restSeconds === 0) {
      setShowRest(false);
    }
    return () => clearInterval(interval);
  }, [showRest, restSeconds]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleComplete = (id: string) => {
    const newSet = new Set(completedExercises);
    if (newSet.has(id)) newSet.delete(id);
    else {
      newSet.add(id);
      if (currentEx.rest_seconds) {
        setRestSeconds(currentEx.rest_seconds);
        setShowRest(true);
      }
    }
    setCompletedExercises(newSet);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md">
        <button onClick={() => onClose(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">TREINANDO AGORA</p>
          <p className="text-sm font-bold truncate max-w-[200px]">{planName}</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
          <TimerIcon className="h-4 w-4" />
          <span className="text-xs font-black tabular-nums">{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Media Area */}
            <div className="aspect-video bg-muted rounded-3xl overflow-hidden border border-border shadow-inner flex items-center justify-center relative group">
              {currentEx.video_url ? (
                <video src={currentEx.video_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <Dumbbell className="h-12 w-12 text-muted-foreground/20" />
              )}
              <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Info className="h-4 w-4" />
              </div>
            </div>

            {/* Exercise Info */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight">{currentEx.exercise_name}</h2>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{currentEx.sets}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Séries</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{currentEx.reps}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Reps</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-black text-primary">{currentEx.weight_kg ?? "—"}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Peso (kg)</p>
                </div>
              </div>
            </div>

            {/* Technical Notes */}
            {currentEx.technical_notes && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  {currentEx.technical_notes}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rest Overlay */}
      <AnimatePresence>
        {showRest && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-4 bottom-32 z-50 bg-foreground text-background p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4"
          >
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Descanso</p>
            <p className="text-6xl font-black tabular-nums">{restSeconds}s</p>
            <button onClick={() => setShowRest(false)} className="text-xs font-bold underline underline-offset-4">Pular descanso</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="p-6 bg-card border-t border-border space-y-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="p-4 bg-muted rounded-2xl disabled:opacity-20 transition-all active:scale-95">
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <Button 
            onClick={() => toggleComplete(currentEx.id)}
            className={`flex-1 h-16 rounded-2xl text-base font-bold shadow-xl transition-all active:scale-95 gap-2 ${
              completedExercises.has(currentEx.id) ? "bg-success hover:bg-success/90" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {completedExercises.has(currentEx.id) ? (
              <><CheckCircle2 className="h-5 w-5" /> Concluído</>
            ) : (
              "Marcar como feito"
            )}
          </Button>

          <button 
            onClick={handleNext}
            disabled={currentIndex === exercises.length - 1}
            className="p-4 bg-muted rounded-2xl disabled:opacity-20 transition-all active:scale-95">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(completedExercises.size / exercises.length) * 100}%` }}
              className="h-full bg-success"
            />
          </div>
          <span className="text-[10px] font-black text-muted-foreground whitespace-nowrap">
            {completedExercises.size} / {exercises.length} FEITO
          </span>
        </div>

        {completedExercises.size === exercises.length && (
          <Button 
            onClick={() => onClose(true)}
            className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black tracking-tight"
          >
            FINALIZAR TREINO
          </Button>
        )}
      </div>
    </motion.div>
  );
};
