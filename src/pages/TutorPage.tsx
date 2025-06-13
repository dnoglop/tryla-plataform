
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { Bot, Send, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getProfile, Profile } from "@/services/profileService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  role: "user" | "tutor";
  content: string;
  isLoading?: boolean;
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isTutor = message.role === 'tutor';

  const renderContent = (content: string) => {
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(\d+)\.\s/g, '<br /><strong>$1.</strong> ')
      .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  if (message.isLoading) {
    return (
      <div className="flex items-center self-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-card p-4 shadow-sm border">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-start gap-3", isTutor ? "justify-start" : "justify-end")}>
      {isTutor && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isTutor
            ? "rounded-bl-none bg-card text-card-foreground shadow-sm border"
            : "rounded-br-none bg-primary text-primary-foreground shadow-lg"
        )}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
};

export default function TutorPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['tutorPageProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return getProfile(user.id);
    }
  });

  const userName = profile?.full_name?.split(' ')[0] || "Aluno";

  useEffect(() => {
    setMessages([
      { id: "welcome", role: "tutor", content: `Olá, ${userName}! Sou a IAê, sua tutora de desenvolvimento. Como posso te ajudar a brilhar hoje?`},
    ]);
  }, [userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputMessage };
    const loadingMsg: Message = { id: `tutor-${Date.now()}`, role: "tutor", content: "", isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('tutor-tryla', {
        body: { prompt: currentInput, userName },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Erro de conexão com a IA.");
      }

      setMessages(prev =>
        prev.map(msg => (msg.id === loadingMsg.id ? { ...msg, isLoading: false, content: data.resposta } : msg))
      );
    } catch (err: any) {
      const errorMessage = `Desculpe, ${userName}. Estou com problemas para me conectar. Tente novamente em alguns instantes.`;
      setMessages(prev =>
        prev.map(msg => (msg.id === loadingMsg.id ? { ...msg, isLoading: false, content: errorMessage } : msg))
      );
      toast.error("Falha na Conexão", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
        <div className="flex h-screen flex-col bg-background animate-pulse">
            <header className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            </header>
            <main className="flex-1 p-4"><div className="h-full w-full"></div></main>
            <footer className="p-4 border-t"><Skeleton className="h-12 w-full rounded-full" /></footer>
        </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="p-4 sm:p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
                onClick={() => navigate('/lab')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95"
                aria-label="Voltar para o Laboratório"
            >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Tutor IAê</h1>
                <p className="text-sm text-muted-foreground">Sua assistente de jornada</p>
            </div>
          </div>
          <div className="relative">
            <img 
                src="https://i.imgur.com/y3pNoHz.png"
                alt="Foto do Tutor IAê" 
                className="h-12 w-12 rounded-full object-cover border-2 border-card shadow-md"
            />
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="sticky bottom-0 w-full border-t border-border bg-background p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Pergunte algo para a IAê..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-full border-2 border-border bg-card px-5 py-3 text-base text-foreground placeholder-muted-foreground transition-all duration-300 focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:scale-100 disabled:bg-muted disabled:shadow-none"
              aria-label="Enviar mensagem"
            >
              <Send className="h-6 w-6 transition-transform duration-300 group-hover:rotate-[-15deg]" />
            </button>
          </form>
      </footer>
    </div>
  );
};
