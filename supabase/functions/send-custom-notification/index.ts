// supabase/functions/send-custom-notification/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://deno.land/x/webpush@0.2.0/mod.ts";

// Configurações de VAPID (essencial)
// Coloque suas chaves VAPID no Vault do Supabase!
// Nome dos secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
const vapidDetails = {
  publicKey: Deno.env.get("VAPID_PUBLIC_KEY")!,
  privateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
  subject: "mailto:contato@tryla.com", // Altere para seu e-mail
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey,
);

serve(async (req) => {
  // 1. Validar o método da requisição
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
    });
  }

  try {
    // 2. Criar um cliente Supabase com a autenticação do usuário que fez a chamada
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // 3. Verificar se o usuário está autenticado e tem a role de 'admin'
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: Requer autenticação." }),
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Acesso negado: Requer privilégios de administrador.",
        }),
        { status: 403 },
      );
    }

    // 4. Se o usuário é admin, prosseguir. Pegar os dados da notificação do corpo da requisição.
    const { title, body, url } = await req.json();
    if (!title || !body) {
      return new Response(
        JSON.stringify({
          error: "Título e corpo da notificação são obrigatórios.",
        }),
        { status: 400 },
      );
    }

    // 5. Usar o SERVICE_ROLE_KEY para ter acesso total e ler todas as inscrições
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("subscription_data");

    if (subsError) throw subsError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Nenhuma inscrição de usuário encontrada para enviar.",
        }),
        { status: 200 },
      );
    }

    // 6. Preparar e enviar as notificações
    const notificationPayload = JSON.stringify({
      title,
      body,
      url: url || "/", // Se não houver URL, abre a página inicial
    });

    const promises = subscriptions.map((s) =>
      webpush
        .sendNotification(s.subscription_data, notificationPayload)
        .catch((err) =>
          console.error(`Falha ao enviar para ${s.id}: ${err.body}`),
        ),
    );

    await Promise.allSettled(promises);

    return new Response(
      JSON.stringify({ success: true, count: subscriptions.length }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Erro na função send-custom-notification:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});
