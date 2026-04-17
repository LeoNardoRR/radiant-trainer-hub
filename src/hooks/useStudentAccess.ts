import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Student access based on active payment status ───────────────
export const useStudentAccess = () => {
  const { user, role } = useAuth();

  const { data: latestPayment, isLoading } = useQuery({
    queryKey: ["student-access", user?.id],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("payments" as any)
          .select("id, status, due_date, amount, payment_plans(name)")
          .eq("student_id", user!.id)
          .order("due_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        return (data as any) ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!user && role === "student",
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Guard: while loading or not a student, return safe defaults
  if (isLoading || !latestPayment) {
    return { hasActivePayment: true, isOverdue: false, latestPayment: null, isLoading };
  }

  const isOverdue =
    latestPayment?.status === "overdue" ||
    (latestPayment?.status === "pending" &&
      latestPayment?.due_date < new Date().toISOString().split("T")[0]);

  const hasActivePayment =
    !latestPayment ||
    latestPayment.status === "paid" ||
    latestPayment.status === "pending";

  return {
    hasActivePayment,
    isOverdue,
    latestPayment,
    isLoading,
  };
};
