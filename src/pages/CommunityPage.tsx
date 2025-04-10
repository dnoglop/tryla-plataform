
import { useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ForumThread from "@/components/ForumThread";
import CommunityEvent from "@/components/CommunityEvent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CommunityPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const threads = [
    {
      id: 1,
      title: "Como vocês aplicam Growth Mindset na prática?",
      author: "Ana Silva",
      authorAvatar: "https://i.pravatar.cc/150?img=5",
      date: "Hoje",
      replies: 12,
      likes: 32,
      tags: ["Growth Mindset", "Dicas"],
    },
    {
      id: 2,
      title: "Galera, o que acharam do módulo de empatia?",
      author: "Lucas Mendes",
      authorAvatar: "https://i.pravatar.cc/150?img=3",
      date: "Ontem",
      replies: 8,
      likes: 21,
      tags: ["Empatia", "Discussão"],
    },
    {
      id: 3,
      title: "Quais habilidades vcs acham mais importantes pra entrevista de emprego?",
      author: "Carla Gomes",
      authorAvatar: "https://i.pravatar.cc/150?img=9",
      date: "2 dias atrás",
      replies: 24,
      likes: 45,
      tags: ["Emprego", "Entrevista", "Dúvida"],
    },
    {
      id: 4,
      title: "Montei um grupo de estudos pra Comunicação! Bora?",
      author: "Marcos Paulo",
      authorAvatar: "https://i.pravatar.cc/150?img=7",
      date: "3 dias atrás",
      replies: 15,
      likes: 29,
      tags: ["Comunicação", "Grupo de Estudos"],
    },
    {
      id: 5,
      title: "Minha experiência com o desafio de autoconhecimento (muito top!)",
      author: "Juliana Costa",
      authorAvatar: "https://i.pravatar.cc/150?img=8",
      date: "4 dias atrás",
      replies: 10,
      likes: 42,
      tags: ["Autoconhecimento", "Relato"],
    },
  ];

  const events = [
    { 
      id: 1, 
      title: "Workshop de Comunicação", 
      date: "2025-04-15", 
      time: "15:00", 
      description: "Aprenda técnicas para se comunicar melhor em entrevistas de emprego",
      location: "Online (Zoom)"
    },
    { 
      id: 2, 
      title: "Roda de Conversa: Mercado de Trabalho", 
      date: "2025-04-20", 
      time: "16:30", 
      description: "Vamos conversar sobre o mercado de trabalho para jovens",
      location: "Centro Comunitário"
    },
    { 
      id: 3, 
      title: "Palestra: Inteligência Emocional", 
      date: "2025-04-25", 
      time: "14:00", 
      description: "Como desenvolver inteligência emocional para o mundo profissional",
      location: "Auditório da Escola"
    }
  ];

  const filteredThreads = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topTags = ["Growth Mindset", "Empatia", "Comunicação", "Emprego", "Autoconhecimento"];

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="👥 Tribo da Trilha" />

      <div className="container px-4 py-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tópicos, eventos ou pessoas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {topTags.map((tag, index) => (
            <button
              key={index}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs hover:border-trilha-orange hover:bg-trilha-orange/5"
              onClick={() => setSearchTerm(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <Tabs defaultValue="forum">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="forum">Fórum</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
            </TabsList>
            <button className="flex items-center gap-1 rounded-full bg-gray-100 p-2">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <TabsContent value="forum" className="mt-4">
            <Tabs defaultValue="populares">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="populares" className="flex-1">Populares</TabsTrigger>
                <TabsTrigger value="recentes" className="flex-1">Recentes</TabsTrigger>
                <TabsTrigger value="seguindo" className="flex-1">Seguindo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="populares" className="space-y-4">
                {filteredThreads.map((thread) => (
                  <ForumThread key={thread.id} {...thread} />
                ))}
              </TabsContent>
              
              <TabsContent value="recentes">
                <div className="rounded-lg border bg-white p-6 text-center">
                  <p className="text-gray-500">
                    Os tópicos recentes aparecerão aqui.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="seguindo">
                <div className="rounded-lg border bg-white p-6 text-center">
                  <p className="text-gray-500">
                    Siga pessoas ou tópicos para vê-los aqui.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="eventos" className="mt-4 space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <CommunityEvent key={event.id} {...event} />
              ))
            ) : (
              <div className="rounded-lg border bg-white p-6 text-center">
                <p className="text-gray-500">
                  Não há eventos que correspondam à sua pesquisa.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <button className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-trilha-orange text-white shadow-lg">
        <Plus className="h-6 w-6" />
      </button>

      <BottomNavigation />
    </div>
  );
};

export default CommunityPage;
