
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PhaseCard from "@/components/PhaseCard";
import ProgressBar from "@/components/ProgressBar";
import { useQuery } from '@tanstack/react-query';
import { getModuleById, getPhasesByModuleId } from "@/services/moduleService";

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const moduleId = parseInt(id || "1");

  // Fetch module data from Supabase
  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModuleById(moduleId),
  });

  // Fetch phases data from Supabase
  const { data: phases = [], isLoading: isLoadingPhases } = useQuery({
    queryKey: ['phases', moduleId],
    queryFn: () => getPhasesByModuleId(moduleId),
    select: (phases) => phases
      .sort((a, b) => a.order_index - b.order_index)
      .map((phase) => ({
        ...phase,
        status: "available" as const,
      })),
  });

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

      <div className="container px-4 py-6 space-y-4">
        <h3 className="font-bold">Fases da Jornada</h3>
        <div className="space-y-3">
          {phases.map((phase) => (
            <PhaseCard 
              key={`${phase.module_id}-${phase.id}`}
              moduleId={phase.module_id}
              phaseId={phase.id}
              title={phase.name}
              description={phase.description}
              duration={phase.duration || 15}
              status={phase.status || "available"}
              iconType={phase.icon_type || (phase.type === "quiz" ? "quiz" : 
                         phase.type === "video" ? "video" : "challenge")}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;
