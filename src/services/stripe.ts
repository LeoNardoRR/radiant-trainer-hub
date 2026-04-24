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
  // Verifica se já tem assinatura
  const { data: existing } = await supabase
    .from("trainer_subscriptions" as any)
    .select("id")
    .eq("trainer_id", trainerId)
    .maybeSingle();

  let dbError;
  if (existing) {
    const { error } = await supabase
      .from("trainer_subscriptions" as any)
      .update({ plan_tier: tier })
      .eq("trainer_id", trainerId);
    dbError = error;
  } else {
    const { error } = await supabase
      .from("trainer_subscriptions" as any)
      .insert({ trainer_id: trainerId, plan_tier: tier });
    dbError = error;
  }

  if (dbError) {
    console.error("Erro no Stripe DB:", dbError);
    throw new Error(dbError.message || "Falha ao gravar assinatura.");
  }

  return {
    url: "/dashboard?checkout=success", // Redirecionamento fake
    success: true
  };
};
