import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type AIWorkoutExercise = {
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
};

export type AIWorkoutPlan = {
  title: string;
  description: string;
  exercises: AIWorkoutExercise[];
};

export const useAIAssistant = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { planTier } = useAuth();

  const generateWorkout = async (prompt: string): Promise<AIWorkoutPlan | null> => {
    // Apenas para planos PRO ou BUSINESS (Feature Gate)
    if (planTier !== "pro" && planTier !== "business") {
      toast.error("Funcionalidade exclusiva para planos Pro e Business.");
      return null;
    }

    if (!prompt.trim()) {
      toast.error("Por favor, descreva o treino que deseja gerar.");
      return null;
    }

    setIsGenerating(true);
    
    // Mock de chamada para Supabase Edge Function / OpenAI
    try {
      // Simula o delay da IA (2.5 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Aqui seria a chamada real: supabase.functions.invoke('generate-workout', { body: { prompt } })
      const mockResult: AIWorkoutPlan = {
        title: "Treino Personalizado IA",
        description: `Treino gerado com base em: "${prompt}"`,
        exercises: [
          { exercise_name: "Aquecimento Articular", sets: 1, reps: "5 min", rest_seconds: 0, notes: "Foco nos ombros e quadril" },
          { exercise_name: "Agachamento Livre", sets: 4, reps: "10-12", rest_seconds: 90, notes: "Descida controlada (3s)" },
          { exercise_name: "Supino Reto", sets: 4, reps: "10-12", rest_seconds: 90, notes: "Manter escápulas retraídas" },
          { exercise_name: "Remada Curvada", sets: 3, reps: "12", rest_seconds: 60, notes: "Tronco inclinado a 45 graus" },
        ]
      };

      toast.success("Treino gerado com sucesso pela IA!");
      return mockResult;
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Falha ao gerar treino. Tente novamente.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateWorkout,
    isGenerating,
  };
};
