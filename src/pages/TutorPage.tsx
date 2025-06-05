import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Send, RefreshCw, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils"; // Certifique-se de que você tem um utilitário `cn` (como no shadcn) para mesclar classes

// --- Interfaces e Tipos ---
interface Message {
  id: string;
  role: "user" | "tutor";
  content: string;
  isLoading?: boolean;
}

// --- Componentes de UI Menores para um Código Mais Limpo ---

// Indicador de Status de Conexão
const ConnectionStatus = ({ isConnected, isLoading, onRetry }: { isConnected: boolean; isLoading: boolean; onRetry: () => void }) => (
  <div className="flex items-center gap-2">
    <div className={cn("h-2.5 w-2.5 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
    <span className="text-sm font-medium text-slate-600">{isConnected ? "Online" : "Offline"}</span>
    {!isConnected && (
      <button onClick={onRetry} disabled={isLoading} className="ml-2">
        <RefreshCw className={cn("h-4 w-4 text-slate-500", isLoading && "animate-spin")} />
      </button>
    )}
  </div>
);

// Bolha de Mensagem
const MessageBubble = ({ message, userName }: { message: Message; userName: string }) => {
  const isTutor = message.role === 'tutor';

  // Função para renderizar conteúdo formatado (Markdown-like)
  const renderContent = (content: string) => {
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/(\d+)\.\s/g, '<br><strong class="font-semibold">$1.</strong> ')
      .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };

  if (message.isLoading) {
    return (
      <div className="flex items-center self-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Bot className="h-6 w-6 text-slate-500" />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <div className="h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex max-w-[85%] items-start gap-3", isTutor ? "self-start" : "self-end")}>
      {isTutor && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Bot className="h-6 w-6 text-slate-500" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isTutor
            ? "rounded-bl-none bg-white text-slate-800 shadow-md"
            : "rounded-br-none bg-orange-500 text-white shadow-lg shadow-orange-500/40"
        )}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
};


// --- Componente Principal da Página ---
const TutorPage = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [userName, setUserName] = useState<string>("Aluno");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para buscar o perfil do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          if (profile?.full_name) {
            setUserName(profile.full_name.split(' ')[0] || "Aluno");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Efeito para mensagem de boas-vindas inicial
  useEffect(() => {
    if (messages.length === 0 && userName) {
      setMessages([
        {
          id: "welcome",
          role: "tutor",
          content: `Olá! Sou a IAê, sua tutora de desenvolvimento. Como posso te ajudar a brilhar hoje?`,
        },
      ]);
    }
  }, [userName]); // Depende do userName para personalizar a saudação

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const testEdgeFunction = async () => {
    // ... (sua lógica de teste de conexão, que já está boa, pode ser mantida)
    toast({ title: "Testando conexão..." });
    setIsLoading(true);
    // ...
    setIsLoading(false);
  };
  
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
        throw new Error(error?.message || data?.error || "Erro de conexão");
      }

      setMessages(prev =>
        prev.map(msg => (msg.id === loadingMsg.id ? { ...msg, isLoading: false, content: data.resposta } : msg))
      );
      setConnectionError(false);
    } catch (err: any) {
      const errorMessage = `Desculpe, ${userName}. Estou com problemas para me conectar. Tente novamente em alguns instantes.`;
      setMessages(prev =>
        prev.map(msg => (msg.id === loadingMsg.id ? { ...msg, isLoading: false, content: errorMessage } : msg))
      );
      setConnectionError(true);
      toast({ title: "Erro de Conexão", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Cabeçalho da Página */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="https://i.imgur.com/y3pNoHz.png" alt="Tutor IAê" className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-50 bg-green-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Tutor IAê</h1>
              <p className="text-sm text-slate-500">Pronta para te ajudar</p>
            </div>
          </div>
          <ConnectionStatus isConnected={!connectionError} isLoading={isLoading} onRetry={testEdgeFunction} />
        </div>
      </header>
      
      {/* Área de Mensagens */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto flex flex-col gap-5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} userName={userName} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input de Mensagem Fixo */}
      <footer className="sticky bottom-0 z-10 w-full border-t border-slate-200 bg-white p-2">
        <div className="container mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Pergunte algo para começar"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-full border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all duration-300 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/50 transition-all duration-300 hover:bg-orange-600 hover:scale-105 active:scale-95 disabled:scale-100 disabled:bg-slate-300 disabled:shadow-none"
              aria-label="Enviar mensagem"
            >
              <Send className="h-6 w-6 transition-transform duration-300 group-hover:rotate-[-10deg]" />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-slate-400">
            A IAê pode cometer erros. Considere checar informações importantes.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TutorPage;