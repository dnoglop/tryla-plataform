
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ProgressBar from "@/components/ProgressBar";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  getModuleById,
  getPhasesByModuleId,
  getUserPhaseStatus,
  getUserNextPhase,
  Phase,
  PhaseStatus
} from "@/services/moduleService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const moduleId = parseInt(id || "1");
  const [userId, setUserId] = useState<string | null>(null);
  const [nextPhase, setNextPhase] = useState<Phase | null>(null);
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

  // Buscar próxima fase para o usuário
  useEffect(() => {
    const fetchNextPhase = async () => {
      if (!userId || !moduleId) return;
      
      try {
        const next = await getUserNextPhase(userId, moduleId);
        setNextPhase(next);
      } catch (error) {
        console.error("Erro ao buscar próxima fase:", error);
      }
    };
    
    fetchNextPhase();
  }, [userId, moduleId, phaseStatuses]);

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

  // Função para iniciar o módulo (ir para a primeira fase ou próxima fase)
  const startModule = () => {
    if (nextPhase) {
      navigate(`/fase/${moduleId}/${nextPhase.id}`);
    } else if (phases.length > 0) {
      navigate(`/fase/${moduleId}/${phases[0].id}`);
    } else {
      toast.error("Não há fases disponíveis neste módulo.");
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
        
        {/* Botão para iniciar o módulo */}
        <div className="mt-4 flex justify-center">
          <Button 
            onClick={startModule}
            className="bg-trilha-orange hover:bg-amber-600 text-white px-6 py-2 rounded-full flex items-center"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            {progress > 0 ? "Continuar módulo" : "Iniciar módulo"}
          </Button>
        </div>
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
        <div className="prose max-w-none mb-6">
          {module.content ? (
            <div dangerouslySetInnerHTML={{ __html: module.content }} />
          ) : (
            <div className="py-4 text-center text-gray-500">
              <p>Nenhum conteúdo introdutório disponível para este módulo.</p>
            </div>
          )}
        </div>

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

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;
