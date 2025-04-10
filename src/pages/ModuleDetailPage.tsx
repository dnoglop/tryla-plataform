
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PhaseCard from "@/components/PhaseCard";
import ProgressBar from "@/components/ProgressBar";

interface Module {
  id: number;
  name: string;
  type?: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
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
  status?: "completed" | "inProgress" | "available" | "locked";
  duration?: number;
}

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const moduleId = parseInt(id || "1");
  const [module, setModule] = useState<Module | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    // Carregar módulo do localStorage
    const storedModules = localStorage.getItem("admin-modules");
    if (storedModules) {
      try {
        const parsedModules = JSON.parse(storedModules);
        const currentModule = parsedModules.find((m: Module) => m.id === moduleId);
        if (currentModule) {
          setModule(currentModule);
        }
      } catch (error) {
        console.error("Error loading module:", error);
      }
    }

    // Carregar fases do localStorage
    const storedPhases = localStorage.getItem("admin-phases");
    if (storedPhases) {
      try {
        const parsedPhases = JSON.parse(storedPhases);
        const modulePhases = parsedPhases
          .filter((p: Phase) => p.moduleId === moduleId)
          .sort((a: Phase, b: Phase) => a.order - b.order)
          .map((phase: Phase) => ({
            ...phase,
            status: "available" as const,
            iconType: phase.type,
            duration: 15 // Duração padrão em minutos
          }));
        setPhases(modulePhases);
      } catch (error) {
        console.error("Error loading phases:", error);
      }
    }
  }, [moduleId]);

  // Calcular progresso baseado nas fases completadas
  const progress = phases.filter(p => p.status === "completed").length / (phases.length || 1) * 100;

  // Determinar cor do módulo baseado no tipo
  const getModuleColor = (type?: string) => {
    switch(type) {
      case "autoconhecimento": return "bg-yellow-100";
      case "empatia": return "bg-red-100";
      case "growth": return "bg-green-100";
      case "comunicacao": return "bg-blue-100";
      case "futuro": return "bg-purple-100";
      default: return "bg-gray-100";
    }
  };

  // Detalhes visuais baseados no tipo
  const typeConfig = {
    autoconhecimento: {
      color: "yellow",
      icon: "🧠",
    },
    empatia: {
      color: "red",
      icon: "❤️",
    },
    growth: {
      color: "green",
      icon: "🌱",
    },
    comunicacao: {
      color: "blue",
      icon: "💬",
    },
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title={module?.name || "Módulo"} />

      <div className={`${getModuleColor(module?.type)} p-6`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            {module?.emoji || "📚"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{module?.name || "Módulo"}</h2>
            <p className="text-sm text-gray-600">{module?.description || "Descrição do módulo"}</p>
          </div>
        </div>

        <div className="mb-1 flex justify-between">
          <span className="text-sm font-medium">Progresso</span>
          <span className="text-sm">{Math.round(progress)}%</span>
        </div>
        <ProgressBar progress={progress} />
      </div>

      <div className="container px-4 py-6 space-y-4">
        <h3 className="font-bold">Fases da Jornada</h3>
        <div className="space-y-3">
          {phases.map((phase) => (
            <PhaseCard 
              key={`${phase.moduleId}-${phase.id}`}
              {...phase}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;
