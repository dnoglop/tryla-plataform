import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cabeçalhos de CORS para permitir requisições de qualquer origem.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Funções VAPID foram removidas para simplificar, pois não eram usadas no código principal ---
// A biblioteca web-push é a forma recomendada, mas vamos focar na lógica principal primeiro.

serve(async (req) => {
  // Lida com a requisição pre-flight OPTIONS do navegador
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rejeita qualquer método que não seja POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // --- INÍCIO DA NOVA LÓGICA DE AUTENTICAÇÃO ---

    const authorization = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Verifica se a chave de serviço secreta foi enviada.
    // Isso é para chamadas de servidor para servidor (como o nosso teste).
    const isServiceRequest = authorization === `Bearer ${serviceRoleKey}`;

    if (!isServiceRequest) {
      // Se NÃO for a chave de serviço, valida o token JWT do usuário.
      // Isso é para chamadas feitas pelo seu app frontend por um usuário logado.

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
          global: { headers: { Authorization: authorization! } },
        },
      );

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({
            error: "Acesso negado: token de usuário inválido.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          },
        );
      }

      // Verifica se o usuário autenticado tem a permissão de 'admin'.
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Acesso restrito a administradores." }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          },
        );
      }
    }
    // Se a requisição usou a chave de serviço (isServiceRequest === true),
    // a execução continua com privilégios totais.

    // --- FIM DA NOVA LÓGICA DE AUTENTICAÇÃO ---

    // Pega o título e a mensagem do corpo da requisição.
    const { title, message: body, url } = await req.json(); // Renomeei 'message' para 'body' para clareza
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Título e mensagem são obrigatórios" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Cria um cliente com permissões de administrador para buscar todas as inscrições.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Busca todas as inscrições de push salvas no banco de dados.
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("subscription_data");

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Nenhuma inscrição de push encontrada para notificar.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // --- Lógica para enviar as notificações (usando uma biblioteca para simplificar) ---
    // Instale a biblioteca web-push se ainda não o fez.
    // Por simplicidade, esta parte está comentada. O importante é a lógica acima funcionar.
    // Você precisará da biblioteca 'web-push' para enviar as notificações de verdade.

    /* 
    // Exemplo com a biblioteca web-push (forma recomendada)
    const webpush = await import('npm:web-push');
    webpush.setVapidDetails(
        'mailto:seu-email@exemplo.com',
        Deno.env.get('VAPID_PUBLIC_KEY'),
        Deno.env.get('VAPID_PRIVATE_KEY')
    );

    const notificationPayload = JSON.stringify({ title, body, url: url || "/" });

    const promises = subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription_data, notificationPayload)
            .catch(err => {
                if (err.statusCode === 410) {
                    // Inscrição expirada, remove do banco.
                    return supabaseAdmin.from('push_subscriptions').delete().match({ 'subscription_data->>endpoint': sub.subscription_data.endpoint });
                } else {
                    console.error('Erro ao enviar notificação:', err.stack);
                }
            })
    );
    await Promise.all(promises);
    */

    // Resposta de sucesso simulada, já que o envio real está comentado.
    console.log(`Simulando envio para ${subscriptions.length} inscrições.`);
    console.log(`Payload:`, { title, body, url });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Autenticação bem-sucedida. ${subscriptions.length} inscrições seriam notificadas.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    // Captura qualquer erro inesperado.
    return new Response(
      JSON.stringify({ error: `Erro interno do servidor: ${err.message}` }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
