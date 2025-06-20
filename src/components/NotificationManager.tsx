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
      // Espera o Service Worker ficar pronto, com um timeout de 5 segundos
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Service Worker não ficou pronto a tempo.")),
            5000,
          ),
        ),
      ]);

      const subscription = await (
        registration as ServiceWorkerRegistration
      ).pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Falha ao verificar inscrição inicial:", error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Deleta do Supabase usando o endpoint como filtro
        const { error: dbError } = await supabase
          .from("push_subscriptions")
          .delete()
          .match({ "subscription_data->>endpoint": subscription.endpoint });

        if (dbError) throw dbError;

        // Desinscreve do navegador
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
    <section className="p-6 rounded-2xl bg-card border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Notificações e Lembretes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
