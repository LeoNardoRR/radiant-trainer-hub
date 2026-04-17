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

export const useLeaderboard = () => {
  const { user, role, profile } = useAuth();

  return useQuery({
    queryKey: ["leaderboard", profile?.trainer_id, user?.id],
    queryFn: async () => {
      const trainerId = role === "trainer" ? user!.id : profile?.trainer_id;
      if (!trainerId) return [];

      const { data: students } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("trainer_id", trainerId)
        .eq("status", "active");

      if (!students || students.length === 0) return [];

      const studentIds = students.map((s) => s.user_id);
      const { data: streaks } = await supabase
        .from("user_streaks")
        .select("*")
        .in("user_id", studentIds);

      const { data: badges } = await supabase
        .from("user_badges")
        .select("user_id, badge_id")
        .in("user_id", studentIds);

      const badgeCounts: Record<string, number> = {};
      badges?.forEach((b) => {
        badgeCounts[b.user_id] = (badgeCounts[b.user_id] || 0) + 1;
      });

      const streakMap: Record<string, any> = {};
      streaks?.forEach((s) => {
        streakMap[s.user_id] = s;
      });

      return students
        .map((s) => ({
          user_id: s.user_id,
          name: s.full_name,
          avatar_url: s.avatar_url,
          total_workouts: streakMap[s.user_id]?.total_workouts || 0,
          current_streak: streakMap[s.user_id]?.current_streak || 0,
          longest_streak: streakMap[s.user_id]?.longest_streak || 0,
          badges: badgeCounts[s.user_id] || 0,
          score: (streakMap[s.user_id]?.total_workouts || 0) * 10 +
            (streakMap[s.user_id]?.current_streak || 0) * 5 +
            (badgeCounts[s.user_id] || 0) * 20,
        }))
        .sort((a, b) => b.score - a.score);
    },
    enabled: !!user,
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
