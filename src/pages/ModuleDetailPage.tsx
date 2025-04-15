
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PhaseCard from "@/components/PhaseCard";
import ProgressBar from "@/components/ProgressBar";
import { useQuery } from '@tanstack/react-query';
import { getModuleById, getPhasesByModuleId, Phase, PhaseStatus } from "@/services/moduleService";

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const moduleId = parseInt(id || "1");
  const [activeTab, setActiveTab] = useState<'intro' | 'phases'>('intro');

  // Fetch module data from Supabase
  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModuleById(moduleId),
  });

  // Fetch phases data from Supabase
  const { data: phases = [], isLoading: isLoadingPhases } = useQuery({
    queryKey: ['phases', moduleId],
    queryFn: () => getPhasesByModuleId(moduleId),
  });

  // Calcular progresso baseado nas fases completadas
  const completedPhases = phases.filter(p => p.status === "completed");
  const progress = phases.length > 0 ? (completedPhases.length / phases.length) * 100 : 0;

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

  if (isLoadingModule || isLoadingPhases) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50">
        <Header title="Módulo não encontrado" />
        <div className="container px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Módulo não encontrado ou foi removido.</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Function to map PhaseStatus to PhaseCard status
  const mapPhaseStatus = (status?: PhaseStatus): "inProgress" | "completed" | "locked" | "available" => {
    if (status === "completed") return "completed";
    if (status === "inProgress") return "inProgress";
    if (status === "notStarted") return "available";
    return "available";
  };

  // Function to map PhaseType to IconType that PhaseCard can use
  const mapIconType = (iconType: string | null): "video" | "quiz" | "challenge" | "game" => {
    if (iconType === "text") return "challenge";
    if (iconType === "video") return "video";
    if (iconType === "quiz") return "quiz";
    if (iconType === "challenge") return "challenge";
    if (iconType === "game") return "game";
    return "challenge";
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title={module.name || "Módulo"} />

      <div className={`${getModuleColor(module.type)} p-6`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            {module.emoji || "📚"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{module.name || "Módulo"}</h2>
            <p className="text-sm text-gray-600">{module.description || "Descrição do módulo"}</p>
          </div>
        </div>

        <div className="mb-1 flex justify-between">
          <span className="text-sm font-medium">Progresso</span>
          <span className="text-sm">{Math.round(progress)}%</span>
        </div>
        <ProgressBar progress={progress} />
      </div>

      <div className="container px-4 py-6">
        {/* Tabs para alternar entre introdução e fases */}
        <div className="border-b mb-4">
          <div className="flex space-x-6">
            <button
              className={`pb-2 font-medium text-sm ${
                activeTab === 'intro' 
                  ? 'border-b-2 border-trilha-orange text-trilha-orange' 
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('intro')}
            >
              Introdução
            </button>
            <button
              className={`pb-2 font-medium text-sm ${
                activeTab === 'phases' 
                  ? 'border-b-2 border-trilha-orange text-trilha-orange' 
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('phases')}
            >
              Fases da Jornada
            </button>
          </div>
        </div>

        {activeTab === 'intro' && (
          <div className="prose max-w-none mb-6">
            {module.content ? (
              <div dangerouslySetInnerHTML={{ __html: module.content }} />
            ) : (
              <div className="py-4 text-center text-gray-500">
                <p>Nenhum conteúdo introdutório disponível para este módulo.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'phases' && (
          <div className="space-y-3">
            <h3 className="font-bold">Fases da Jornada</h3>
            {phases.map((phase) => (
              <PhaseCard 
                key={`${phase.module_id}-${phase.id}`}
                moduleId={phase.module_id || moduleId}
                phaseId={phase.id}
                title={phase.name}
                description={phase.description}
                duration={phase.duration || 15}
                status={mapPhaseStatus(phase.status)}
                iconType={mapIconType(phase.icon_type)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;
