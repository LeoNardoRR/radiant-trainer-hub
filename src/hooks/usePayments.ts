import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Payment Plans ─────────────────────────────────────────────
export const usePaymentPlans = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["payment-plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_plans" as any)
        .select("*")
        .eq("trainer_id", user!.id)
        .order("price");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useCreatePaymentPlan = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (plan: {
      name: string;
      price: number;
      sessions_per_month?: number;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("payment_plans" as any)
        .insert({ ...plan, trainer_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-plans"] });
      toast.success("Plano criado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdatePaymentPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("payment_plans" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-plans"] });
      toast.success("Plano atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeletePaymentPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_plans" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-plans"] });
      toast.success("Plano removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ─── Payments ──────────────────────────────────────────────────
export const usePayments = (studentId?: string) => {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["payments", user?.id, studentId],
    queryFn: async () => {
      let query = supabase
        .from("payments" as any)
        .select("*, payment_plans(*)")
        .order("due_date", { ascending: false });

      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with student profiles
      const payments = data as any[];
      const studentIds = [...new Set(payments.map((p: any) => p.student_id))];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", studentIds);
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
        return payments.map((p: any) => ({
          ...p,
          student: profileMap.get(p.student_id) || null,
        }));
      }
      return payments;
    },
    enabled: !!user,
  });
};

export const useStudentPayments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments" as any)
        .select("*, payment_plans(*)")
        .eq("student_id", user!.id)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useCreatePayment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: {
      student_id: string;
      amount: number;
      due_date: string;
      plan_id?: string;
      reference_month?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("payments" as any)
        .insert({ ...payment, trainer_id: user?.id, status: "pending" })
        .select()
        .single();
      if (error) throw error;

      // Notify student
      await supabase.from("notifications").insert({
        user_id: payment.student_id,
        title: "Cobrança gerada",
        message: `Uma cobrança de R$ ${payment.amount.toFixed(2)} foi gerada. Vencimento: ${payment.due_date}`,
        type: "payment",
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Cobrança criada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdatePaymentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      student_id,
    }: {
      id: string;
      status: "pending" | "paid" | "overdue" | "cancelled";
      student_id: string;
    }) => {
      const updateData: any = { status };
      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("payments" as any)
        .update(updateData)
        .eq("id", id);
      if (error) throw error;

      if (status === "paid") {
        await supabase.from("notifications").insert({
          user_id: student_id,
          title: "Pagamento confirmado ✅",
          message: "Seu pagamento foi confirmado pelo personal.",
          type: "payment",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ─── Financial summary helpers ──────────────────────────────────
export const useFinancialSummary = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial-summary", user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const { data, error } = await supabase
        .from("payments" as any)
        .select("amount, status, due_date, paid_at")
        .eq("trainer_id", user!.id);

      if (error) throw error;
      const payments = data as any[];

      const monthPayments = payments.filter(
        (p: any) => p.due_date >= monthStart && p.due_date <= monthEnd
      );

      const totalRevenuePaid = payments
        .filter((p: any) => p.status === "paid")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const monthRevenue = monthPayments
        .filter((p: any) => p.status === "paid")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const pendingAmount = payments
        .filter((p: any) => p.status === "pending")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const overdueAmount = payments
        .filter((p: any) => p.status === "overdue" || (p.status === "pending" && p.due_date < now.toISOString().split("T")[0]))
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return {
        totalRevenuePaid,
        monthRevenue,
        pendingAmount,
        overdueAmount,
        totalPayments: payments.length,
        paidCount: payments.filter((p: any) => p.status === "paid").length,
        pendingCount: payments.filter((p: any) => p.status === "pending").length,
        overdueCount: payments.filter((p: any) => p.status === "overdue").length,
      };
    },
    enabled: !!user,
  });
};
