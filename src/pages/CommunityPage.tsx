
import { useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ForumThread from "@/components/ForumThread";
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

  const filteredThreads = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
            placeholder="Buscar tópicos, pessoas ou tags..."
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

        <Tabs defaultValue="populares">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="populares">Populares</TabsTrigger>
              <TabsTrigger value="recentes">Recentes</TabsTrigger>
              <TabsTrigger value="seguindo">Seguindo</TabsTrigger>
            </TabsList>
            <button className="flex items-center gap-1 rounded-full bg-gray-100 p-2">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <TabsContent value="populares" className="mt-4 space-y-4">
            {filteredThreads.map((thread) => (
              <ForumThread key={thread.id} {...thread} />
            ))}
          </TabsContent>
          
          <TabsContent value="recentes" className="mt-4">
            <div className="rounded-lg border bg-white p-6 text-center">
              <p className="text-gray-500">
                Os tópicos recentes aparecerão aqui.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="seguindo" className="mt-4">
            <div className="rounded-lg border bg-white p-6 text-center">
              <p className="text-gray-500">
                Siga pessoas ou tópicos para vê-los aqui.
              </p>
            </div>
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
