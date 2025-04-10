
import { useState, useEffect } from "react";
import { Search, Video, FileText, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import ProgressBar from "@/components/ProgressBar";

// Import module types
interface Module {
  id: number;
  name: string;
  type?: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
  progress?: number;
  completed?: boolean;
  locked?: boolean;
  description?: string;
  emoji?: string;
}

interface Phase {
  id: number;
  moduleId: number;
  title: string;
  type: "video" | "text" | "quiz";
  content: string;
  order: number;
}

const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [totalProgress, setTotalProgress] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  
  // Fetch modules and phases from localStorage (simulating getting from admin)
  useEffect(() => {
    const storedModules = localStorage.getItem("admin-modules");
    const storedPhases = localStorage.getItem("admin-phases");
    
    if (storedModules) {
      try {
        const parsedModules = JSON.parse(storedModules);
        
        // Map admin modules to the format expected by ModuleCard
        const formattedModules = parsedModules.map((module: any, index: number) => ({
          id: module.id,
          title: module.name,
          type: module.type || "autoconhecimento", 
          progress: 0,
          completed: false,
          locked: index > 1, // Lock all except first two modules
          description: module.description,
          emoji: module.emoji
        }));
        
        setModules(formattedModules);
      } catch (error) {
        console.error("Error parsing modules:", error);
        // Fallback to default modules if there's an error
        setModules(defaultModules);
      }
    } else {
      setModules(defaultModules);
    }
    
    if (storedPhases) {
      try {
        const parsedPhases = JSON.parse(storedPhases);
        setPhases(parsedPhases);
      } catch (error) {
        console.error("Error parsing phases:", error);
        setPhases([]);
      }
    }
  }, []);

  const defaultModules = [
    {
      id: 1,
      title: "Mestre de Si",
      type: "autoconhecimento" as const,
      progress: 75,
      completed: false,
    },
    {
      id: 2,
      title: "Olhar do Outro",
      type: "empatia" as const,
      progress: 25,
      completed: false,
    },
    {
      id: 3,
      title: "Mente Infinita",
      type: "growth" as const,
      progress: 0,
      completed: false,
      locked: true,
    },
    {
      id: 4,
      title: "Papo Reto",
      type: "comunicacao" as const,
      progress: 0,
      completed: false,
      locked: true,
    },
    {
      id: 5,
      title: "??????????",
      type: "futuro" as const,
      progress: 0,
      completed: false,
      locked: true,
    },
  ];

  const filteredModules = modules.filter((module) =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total progress
  useEffect(() => {
    const completedPercentage = modules.reduce(
      (sum, module) => sum + (module.progress || 0), 
      0
    ) / (modules.length || 1);
    
    setTotalProgress(Math.round(completedPercentage));
  }, [modules]);

  // Group phases by module
  const getModuleContent = (moduleId: number) => {
    return phases.filter(phase => phase.moduleId === moduleId);
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="🎯 Base de Treinamento" />

      <div className="container px-4 py-6 space-y-6">
        <div className="card-trilha p-4">
          <h2 className="mb-2 font-bold">Progresso Total</h2>
          <ProgressBar progress={totalProgress} />
          <p className="mt-1 text-right text-sm text-gray-600">{totalProgress}% completo</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
          />
        </div>

        <div className="space-y-4">
          {filteredModules.map((module) => (
            <div key={module.id} className="space-y-2">
              <ModuleCard key={module.id} {...module} />
              
              {/* Show content count for each module */}
              {!module.locked && (
                <div className="ml-4 flex space-x-3 text-xs text-gray-500">
                  {getModuleContent(module.id).filter(p => p.type === 'video').length > 0 && (
                    <div className="flex items-center">
                      <Video className="h-3 w-3 mr-1" />
                      {getModuleContent(module.id).filter(p => p.type === 'video').length} vídeos
                    </div>
                  )}
                  {getModuleContent(module.id).filter(p => p.type === 'text').length > 0 && (
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {getModuleContent(module.id).filter(p => p.type === 'text').length} textos
                    </div>
                  )}
                  {getModuleContent(module.id).filter(p => p.type === 'quiz').length > 0 && (
                    <div className="flex items-center">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      {getModuleContent(module.id).filter(p => p.type === 'quiz').length} quizes
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModulesPage;
