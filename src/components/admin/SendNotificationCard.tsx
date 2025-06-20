// src/components/admin/SendNotificationCard.tsx

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const SendNotificationCard: React.FC = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast({
        title: "Campos obrigatórios",
        description:
          "O título e a mensagem da notificação não podem estar vazios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-custom-notification",
        {
          body: { title, body, url: url || "/" },
        },
      );

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Notificações enviadas para ${data.count} usuários.`,
      });
      setTitle("");
      setBody("");
      setUrl("");
    } catch (error: any) {
      console.error("Erro ao invocar a função:", error);
      toast({
        title: "Falha no Envio",
        description: error.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm h-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Enviar Notificação para Todos
      </h3>
      <form onSubmit={handleSendNotifications} className="flex flex-col gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Novo Desafio!"
            required
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="body">Mensagem</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ex: Venha conferir o novo desafio diário e ganhe XP!"
            required
            rows={4}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="url">URL de Destino (Opcional)</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/modulos"
          />
          <p className="text-xs text-muted-foreground">
            Para onde o usuário vai ao clicar. Ex: /diario
          </p>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full mt-2">
          {isLoading ? "Enviando..." : "Disparar Notificações"}
        </Button>
      </form>
    </div>
  );
};

export default SendNotificationCard;
