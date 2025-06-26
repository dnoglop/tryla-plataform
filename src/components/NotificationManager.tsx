// src/components/NotificationManager.tsx

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

// Função auxiliar para converter a chave VAPID pública para o formato Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationManager: React.FC = () => {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);

  // --- LÓGICA DE VERIFICAÇÃO INICIAL COM TIMEOUT ---
  const checkCurrentSubscription = useCallback(async () => {
    setIsLoading(true);

    // Primeiro, verifica se o navegador tem suporte básico.
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsUnsupported(true);
      setIsLoading(false);
      return;
    }
    if (Notification.permission === "denied") {
      setIsPermissionDenied(true);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Pega o usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Se não tiver usuário, não está inscrito.
      if (!user) {
        setIsSubscribed(false);
        return;
      }

      // 2. Procura por uma inscrição para este usuário no BANCO DE DADOS
      const { data: existingSubscription, error } = await supabase
        .from("push_subscriptions")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(); // Pega um único registro ou nulo, é mais eficiente

      if (error) {
        // Se der erro na consulta, assume que não está inscrito para evitar problemas.
        console.error("Erro ao verificar inscrição no Supabase:", error);
        setIsSubscribed(false);
        return;
      }

      // 3. Define o estado do toggle com base no resultado do banco
      // A dupla negação (!!) transforma o objeto (ou null) em um booleano (true/false)
      setIsSubscribed(!!existingSubscription);
    } catch (error) {
      console.error("Falha geral ao verificar inscrição inicial:", error);
      setIsSubscribed(false); // Em caso de qualquer outro erro, o padrão é 'desligado'
    } finally {
      setIsLoading(false); // Garante que o loading sempre termine
    }
  }, []);

  useEffect(() => {
    // Roda a verificação inicial apenas uma vez
    checkCurrentSubscription();
  }, [checkCurrentSubscription]);

  // --- FUNÇÃO PARA INSCREVER (ATIVAR) ---
  const subscribeUser = async () => {
    setIsLoading(true);
    try {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error(
          "Configuração inválida: Chave VAPID pública não encontrada.",
        );
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          subscription_data: subscription,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Notificações Ativadas!",
        description: "Você está pronto para receber novidades.",
      });
    } catch (error: any) {
      console.error("Erro ao inscrever-se para notificações:", error);
      toast({
        title: "Ops!",
        description: `Não foi possível ativar as notificações.`,
        variant: "destructive",
      });
      if (Notification.permission === "denied") {
        setIsPermissionDenied(true);
      }
      // Garante que o toggle volte ao estado correto em caso de falha
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNÇÃO PARA DESINSCREVER (DESATIVAR) ---
  const unsubscribeUser = async () => {
    setIsLoading(true);
    try {
      // 1. Pega o usuário autenticado primeiro
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Se por algum motivo não encontrar o usuário, não prossegue
        throw new Error("Usuário não encontrado para desinscrever.");
      }

      // 2. Deleta a inscrição no banco de dados usando o user_id
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id); // <-- MUDANÇA PRINCIPAL AQUI

      if (dbError) throw dbError;

      // 3. Desinscreve do navegador apenas se o delete no BD deu certo
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast({
        title: "Notificações Desativadas",
        description: "Você não receberá mais lembretes neste dispositivo.",
      });
    } catch (error: any) {
      console.error("Erro ao desinscrever:", error);
      toast({
        title: "Erro ao desativar",
        description: error.message,
        variant: "destructive",
      });
      // Garante que o toggle volte ao estado correto em caso de falha
      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNÇÃO CHAMADA PELO SWITCH ---
  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      subscribeUser();
    } else {
      unsubscribeUser();
    }
  };

  // --- RENDERIZAÇÃO CONDICIONAL DA UI ---
  if (isUnsupported) {
    return (
      <section className="p-6 rounded-2xl bg-muted/50 border">
        <h2 className="text-lg font-semibold text-card-foreground">
          Notificações e Lembretes
        </h2>
        <p className="mt-1 text-sm text-center text-muted-foreground">
          Infelizmente, seu navegador não suporta notificações push.
        </p>
      </section>
    );
  }

  if (isPermissionDenied) {
    return (
      <section className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20">
        <h2 className="mb-2 text-lg font-semibold text-destructive">
          Notificações Bloqueadas
        </h2>
        <p className="text-sm text-destructive/90">
          Você bloqueou as permissões de notificação para este site. Para
          ativá-las, você precisa ir até as configurações do seu navegador,
          encontrar as permissões do site Tryla e permitir as notificações.
        </p>
      </section>
    );
  }

  return (
    <section className="p-6 rounded-2xl bg-trilha-orange border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Notificações e Lembretes
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Receba novidades e avisos importantes do Tryla.
          </p>
        </div>
        {isLoading ? (
          <div className="h-6 w-10 bg-muted rounded-full animate-pulse"></div>
        ) : (
          <Switch
            id="notifications-toggle"
            checked={isSubscribed}
            onCheckedChange={handleToggleChange}
            aria-label="Ativar ou desativar notificações"
          />
        )}
      </div>
    </section>
  );
};

export default NotificationManager;
