import { supabase } from "@/integrations/supabase/client";

export interface CreateCheckoutSessionParams {
  tier: "pro" | "business";
  trainerId: string;
  email: string;
}

/**
 * Simula a chamada para uma Edge Function (ex: Supabase Edge Functions)
 * que se comunicaria com a API do Stripe ou Asaas para gerar um Link de Checkout.
 */
export const createCheckoutSession = async ({ tier, trainerId, email }: CreateCheckoutSessionParams) => {
  // Em produção, isso seria:
  // const { data, error } = await supabase.functions.invoke('create-checkout', { body: { tier, trainerId, email } })
  // return data.url;

  console.log(`[Stripe API Mock] Creating checkout for ${email} - Plan: ${tier}`);

  // Simulação de delay de rede
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulando a atualização direta no banco de dados para fins de MVP
  // Na vida real, isso seria feito via Webhook do Stripe (ex: invoice.paid)
  const { error } = await supabase
    .from("trainer_subscriptions" as any)
    .upsert({
      trainer_id: trainerId,
      plan_tier: tier,
      status: "active",
      current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    }, { onConflict: "trainer_id" });

  if (error) {
    console.error("Erro ao simular assinatura:", error);
    throw new Error("Falha ao se comunicar com o provedor de pagamentos.");
  }

  return {
    url: "/dashboard?checkout=success", // Redirecionamento fake
    success: true
  };
};
