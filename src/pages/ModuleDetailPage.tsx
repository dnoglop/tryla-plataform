
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import PhaseCard from "@/components/PhaseCard";
import ProgressBar from "@/components/ProgressBar";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  getModuleById,
  getPhasesByModuleId,
  getUserPhaseStatus,
  Phase,
  PhaseStatus
} from "@/services/moduleService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const moduleId = parseInt(id || "1");
  const [activeTab, setActiveTab] = useState<'intro' | 'phases'>('intro');
  const [userId, setUserId] = useState<string | null>(null);
  const [phaseStatuses, setPhaseStatuses] = useState<{[key: number]: PhaseStatus}>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        navigate("/login");
      }
    };

    getUser();
  }, [navigate]);

  // Fetch module data from Supabase
  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModuleById(moduleId),
    enabled: !!moduleId,
  });

  // Fetch phases data from Supabase
  const { data: phases = [], isLoading: isLoadingPhases } = useQuery({
    queryKey: ['phases', moduleId],
    queryFn: () => getPhasesByModuleId(moduleId),
    enabled: !!moduleId,
  });

  // Buscar status das fases
  useEffect(() => {
    const fetchPhaseStatuses = async () => {
      if (!userId || phases.length === 0) return;
      
      setIsLoadingStatuses(true);
      try {
        const statusMap: {[key: number]: PhaseStatus} = {};
        
        for (const phase of phases) {
          const status = await getUserPhaseStatus(userId, phase.id);
          statusMap[phase.id] = (status as PhaseStatus) || "notStarted";
        }
        
        setPhaseStatuses(statusMap);
      } catch (error) {
        console.error("Erro ao buscar status das fases:", error);
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    
    fetchPhaseStatuses();
  }, [userId, phases]);

  // Calcular progresso baseado nas fases completadas
  const completedPhases = phases.filter(p => phaseStatuses[p.id] === "completed").length;
  const progress = phases.length > 0 ? (completedPhases / phases.length) * 100 : 0;

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

  const navigateToNextModule = () => {
    const nextModuleId = moduleId + 1;
    navigate(`/modulo/${nextModuleId}`);
  };

  const navigateToPrevModule = () => {
    if (moduleId > 1) {
      const prevModuleId = moduleId - 1;
      navigate(`/modulo/${prevModuleId}`);
    }
  };

  if (isLoadingModule || isLoadingPhases || isLoadingStatuses) {
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
          <div className="flex-1">
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
      
      <div className="flex justify-between px-4 pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={navigateToPrevModule}
          disabled={moduleId <= 1}
          className={moduleId <= 1 ? "invisible" : ""}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={navigateToNextModule}
        >
          Próximo <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="container px-4 py-4">
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
                description={phase.description || ''}
                duration={phase.duration || 15}
                status={mapPhaseStatus(phaseStatuses[phase.id])}
                iconType={mapIconType(phase.icon_type)}
              />
            ))}
            
            {completedPhases === phases.length && phases.length > 0 && (
              <div className="mt-6 bg-green-100 rounded-lg p-4 text-center animate-pulse">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-lg font-bold text-green-800">Módulo completo!</h3>
                <p className="text-sm text-green-700 mb-4">
                  Parabéns! Você concluiu todas as fases deste módulo.
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => toast.success("Parabéns pelo módulo completo!")}
                >
                  Resgatar emblema
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;
