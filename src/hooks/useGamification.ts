import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUserStreak = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ["user-streak", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
};

export const useBadges = () => {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("requirement_value", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useUserBadges = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ["user-badges", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", targetId!);
      if (error) throw error;
      return data;
    },
    enabled: !!targetId,
  });
};

export const useUpdateStreak = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const today = new Date().toISOString().split("T")[0];

      // Get current streak
      const { data: existing } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        // Create new streak record
        const { error } = await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          total_workouts: 1,
          last_workout_date: today,
        });
        if (error) throw error;
      } else {
        const lastDate = existing.last_workout_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = existing.current_streak;
        if (lastDate === today) {
          // Already logged today
          return;
        } else if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        const longestStreak = Math.max(newStreak, existing.longest_streak);

        const { error } = await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            total_workouts: existing.total_workouts + 1,
            last_workout_date: today,
          })
          .eq("user_id", user.id);
        if (error) throw error;

        // Check for badge unlocks
        const { data: allBadges } = await supabase.from("badges").select("*");
        const { data: userBadges } = await supabase
          .from("user_badges")
          .select("badge_id")
          .eq("user_id", user.id);

        const earnedIds = new Set(userBadges?.map((b) => b.badge_id) || []);
        const totalWorkouts = existing.total_workouts + 1;

        for (const badge of allBadges || []) {
          if (earnedIds.has(badge.id)) continue;
          const met =
            (badge.requirement_type === "streak" && newStreak >= badge.requirement_value) ||
            (badge.requirement_type === "total_workouts" && totalWorkouts >= badge.requirement_value);
          if (met) {
            await supabase.from("user_badges").insert({
              user_id: user.id,
              badge_id: badge.id,
            });
            // Notify user
            await supabase.from("notifications").insert({
              user_id: user.id,
              title: `Conquista desbloqueada: ${badge.name}`,
              message: badge.description,
              type: "achievement",
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-streak"] });
      qc.invalidateQueries({ queryKey: ["user-badges"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
