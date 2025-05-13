import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageCircle, Send, RefreshCw } from "lucide-react";
import { getModules } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  role: "user" | "tutor";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

const TutorPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [userIntroduced, setUserIntroduced] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
  });

  useEffect(() => {
    // Verificar se o usuário já se apresentou (usando localStorage)
    const hasIntroduced = localStorage.getItem('tutorIntroduced') === 'true';
    setUserIntroduced(hasIntroduced);
    
    // Buscar informações do usuário do Supabase
    const fetchUserProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          // Buscar o nome completo do usuário na tabela 'profiles'
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userData.user.id)
            .single();
            
          if (profileData?.full_name) {
            // Extrair o primeiro nome
            const firstName = profileData.full_name.split(' ')[0];
            console.log('Nome obtido do perfil:', firstName);
            setUserName(firstName);
          } else {
            console.log('Perfil encontrado, mas sem nome completo definido');
            setUserName(""); // Definir nome como string vazia se não houver nome no perfil
          }
        } else {
          console.log('Usuário não autenticado');
          setUserName(""); // Definir nome como string vazia se usuário não estiver autenticado
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        setUserName(""); // Definir nome como string vazia em caso de erro
      }
    };
    
    // Buscar o perfil do usuário diretamente do Supabase
    fetchUserProfile();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

// Adicionar mensagem apropriada quando a página carregar
useEffect(() => {
  if (messages.length === 0) {
    const hasIntroduced = localStorage.getItem('tutorIntroduced') === 'true';
    
    if (hasIntroduced && userName) {
      setMessages([
        {
          id: "welcome",
          role: "tutor",
          content: `Olá, ${userName}! Eu sou o Tutor Tryla, seu assistente de aprendizado. Como posso ajudar você hoje? Você pode me fazer perguntas sobre qualquer um dos temas dos módulos!`,
          timestamp: new Date(),
        },
      ]);
    } else if (hasIntroduced) {
      setMessages([
        {
          id: "welcome",
          role: "tutor",
          content: "Olá! Eu sou o Tutor Tryla, seu assistente de aprendizado. Como posso ajudar você hoje? Você pode me fazer perguntas sobre qualquer um dos temas dos módulos!",
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: "introduction",
          role: "tutor",
          content: "Olá! Eu sou o Tutor Tryla, seu assistente de aprendizado. **Antes de começarmos**, gostaria que você se apresentasse brevemente. Conte-me seu nome, idade e o que você espera aprender aqui na Tryla!",
          timestamp: new Date(),
        },
      ]);
    }
  }
}, [messages.length, userName]);

  // Função para testar a conexão com a função Edge
  const testEdgeFunction = async () => {
    setConnectionError(false);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('tutor-tryla', {
        body: { 
          prompt: "Olá, esta é uma mensagem de teste para verificar se você está funcionando corretamente.",
          module: "" 
        },
      });
      
      if (error) {
        console.error("Erro ao testar a conexão:", error);
        setConnectionError(true);
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao Tutor Tryla. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!data || !data.resposta) {
        setConnectionError(true);
        toast({
          title: "Resposta inválida",
          description: "O servidor respondeu, mas a resposta é inválida.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Conexão estabelecida",
        description: "O Tutor Tryla está online e pronto para responder!",
      });
      return true;
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionError(true);
      toast({
        title: "Erro de conexão",
        description: "Ocorreu um erro ao testar a conexão com o Tutor Tryla.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Gerar um ID único para a mensagem
    const messageId = Date.now().toString();
    
    // Adicionar a mensagem do usuário
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    
    // Adicionar um placeholder para a resposta do tutor
    const tutorPlaceholder: Message = {
      id: `tutor-${messageId}`,
      role: "tutor",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages(prev => [...prev, userMessage, tutorPlaceholder]);
    setInputMessage("");
    setIsLoading(true);

    // Se for a primeira interação e o usuário não se apresentou ainda
    if (!userIntroduced) {
      localStorage.setItem('tutorIntroduced', 'true');
      setUserIntroduced(true);
    }
    
    try {
      console.log('Nome do usuário antes de enviar mensagem:', userName);
      
      const { data, error } = await supabase.functions.invoke('tutor-tryla', {
        body: { 
          prompt: inputMessage,
          module: selectedModule,
          userName: userName // Enviar o nome do usuário para a função Edge
        },
      });
      
      if (error) {
        console.error("Erro ao chamar o Tutor Tryla:", error);
        setConnectionError(true);
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao Tutor Tryla. Por favor, verifique sua conexão.",
          variant: "destructive",
        });
        
        // Atualiza a mensagem de placeholder para mostrar o erro
        setMessages(prev => prev.map(msg => 
          msg.id === `tutor-${messageId}` 
            ? { ...msg, content: `Desculpe ${userName ? userName : ""}, estou com dificuldades para responder agora. Tente verificar sua conexão clicando no botão 'Testar Conexão' acima.`, isLoading: false } 
            : msg
        ));
      } else if (data?.error) {
        console.error("Erro retornado pelo servidor:", data.error);
        setConnectionError(true);
        toast({
          title: "Erro no servidor",
          description: data.error || "Ocorreu um erro ao processar sua solicitação.",
          variant: "destructive",
        });
        
        // Atualiza a mensagem de placeholder com o erro
        setMessages(prev => prev.map(msg => 
          msg.id === `tutor-${messageId}` 
            ? { ...msg, content: `Desculpe ${userName ? userName : ""}, ocorreu um erro ao processar sua pergunta: ${data.error}`, isLoading: false } 
            : msg
        ));
      } else if (!data || !data.resposta) {
        setConnectionError(true);
        
        // Atualiza a mensagem de placeholder
        setMessages(prev => prev.map(msg => 
          msg.id === `tutor-${messageId}` 
            ? { ...msg, content: `Desculpe ${userName ? userName : ""}, recebi uma resposta vazia do servidor. Tente novamente mais tarde.`, isLoading: false } 
            : msg
        ));
      } else {
        // Adicionar o nome do usuário à resposta se não estiver presente
        let resposta = data.resposta;
        console.log('Nome atual do usuário para resposta:', userName);
        
        // Verificar se o nome está presente na resposta (considerando variações de capitalização)
        const nameInResponse = userName && 
          (resposta.toLowerCase().includes(userName.toLowerCase()) ||
           resposta.toLowerCase().includes(userName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
        
        console.log('Resposta inclui o nome?', nameInResponse);
        
        if (userName && !nameInResponse) {
          // Verificar se a resposta começa com saudação
          if (resposta.match(/^(Olá|Oi|Bem|Claro|Certo|Entendi|Compreendo)/i)) {
            resposta = resposta.replace(/^(Olá|Oi|Bem|Claro|Certo|Entendi|Compreendo)/i, `$1, ${userName}`);
          } else {
            resposta = `${userName}, ${resposta}`;
          }
          console.log('Resposta modificada:', resposta);
        }
        
        // Atualiza a mensagem de placeholder com a resposta real
        setMessages(prev => prev.map(msg => 
          msg.id === `tutor-${messageId}` 
            ? { ...msg, content: resposta, isLoading: false } 
            : msg
        ));
        setConnectionError(false);
      }
    } catch (error) {
      console.error("Erro ao processar a resposta:", error);
      setConnectionError(true);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua pergunta.",
        variant: "destructive",
      });
      
      // Atualiza a mensagem de placeholder para mostrar o erro
      setMessages(prev => prev.map(msg => 
        msg.id === `tutor-${messageId}` 
          ? { ...msg, content: `Desculpe ${userName ? userName : ""}, algo deu errado. Tente novamente mais tarde ou utilize o botão 'Testar Conexão'.`, isLoading: false } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Função para renderizar o conteúdo da mensagem com formatação melhorada
  const renderMessageContent = (content: string) => {
    // Formato de parágrafo - adiciona quebras de linha entre parágrafos
    const paragraphSplit = content.split('\n\n').map((paragraph, i) => {
      // Aplicar formatação dentro de cada parágrafo
      
      // Substituir **texto** por <strong>texto</strong> (negrito)
      const boldReplaced = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Substituir _texto_ ou *texto* por <em>texto</em> (itálico)
      const italicReplaced = boldReplaced.replace(/(_|\*)(.*?)(_|\*)/g, '<em>$2</em>');
      
      // Substituir [texto](url) por <a href="url" target="_blank" rel="noopener noreferrer">texto</a> (link)
      const linkReplaced = italicReplaced.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>');
      
      // Substituir numerações (1. Texto) com formatação adequada
      const numberedReplaced = linkReplaced.replace(/(\d+)\.\s+(.*)/g, '<span class="font-medium">$1.</span> $2');
      
      return (
        <p key={i} className="mb-3">{
          <div dangerouslySetInnerHTML={{ __html: numberedReplaced }} />
        }</p>
      );
    });
    
    return <div className="whitespace-pre-wrap">{paragraphSplit}</div>;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Função para lidar com o botão voltar
  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header 
        title="Tutor Tryla" 
        showBackButton={true} 
        onBackClick={handleBackClick}
      />
      
      <div className="container px-4 py-4 pb-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="chat" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex-1">
              <Bot className="w-4 h-4 mr-2" />
              Módulos
            </TabsTrigger>
          </TabsList>
            <TabsContent value="chat" className="h-[calc(100vh-240px)] flex flex-col">
              {connectionError && (
                <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-md p-3">
                  <div className="flex items-center">
                    <div className="text-yellow-700">
                      <p className="font-medium">Problema de conexão detectado</p>
                      <p className="text-sm">O Tutor Tryla parece estar com dificuldades para responder.</p>
                    </div>
                    <div className="ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testEdgeFunction}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Testar Conexão
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <Card className="flex-1 overflow-hidden flex flex-col mb-4">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        ) : (
                          renderMessageContent(message.content)
                        )}
                        <p className={`text-xs mt-1 ${message.role === "user" ? "text-gray-200" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </Card>
              <p className="italic text-xs text-gray-600 mb-2">
                Sempre reflita as respostas do Tutor e como isso pode se aplicar à você.
                Aqui não tem verdades absolutas, apenas provocações para você refletir e ter novas ideias.
              </p>
              <div className="flex mb-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua pergunta aqui..."
                  className="flex-1 mr-1 resize-none overflow-hidden"
                  disabled={isLoading}
                  rows={isMobile ? 1 : 2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-auto"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="modules" className="h-300px overflow-y-auto pb-2">
              <p className="text-sm text-gray-600 mb-3">
                Selecione um módulo para direcionar suas perguntas para um tema específico.
                O Tutor Tryla adaptará suas respostas ao tema escolhido.
              </p>
              
              <div className="flex flex-col space-y-1">
                <Card
                  className={`p-3 cursor-pointer transition-all ${
                    selectedModule === "" ? "border-orange-500 shadow-md" : "hover:border-orange-300"
                  }`}
                  onClick={() => setSelectedModule("")}
                >
                  <div className="flex items-center">
                    <div className="text-xl mr-3">🧠</div>
                    <div>
                      <h3 className="font-medium">Todos os temas</h3>
                      <p className="text-xs text-gray-500">Perguntas gerais sobre desenvolvimento socioemocional</p>
                    </div>
                  </div>
                </Card>
                
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedModule === module.type ? "border-orange-500 shadow-md" : "hover:border-orange-300"
                    }`}
                    onClick={() => setSelectedModule(module.type)}
                  >
                    <div className="flex items-center">
                      <div className="text-xl mr-3">{module.emoji || "📚"}</div>
                      <div>
                        <h3 className="font-medium">{module.name}</h3>
                        <p className="text-xs text-gray-500">{module.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
};
export default TutorPage;