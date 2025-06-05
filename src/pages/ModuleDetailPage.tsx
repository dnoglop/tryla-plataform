import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import {
  getModuleById,
  getPhasesByModuleId,
  getUserPhaseStatus,
  getModuleProgress,
  Phase,
  PhaseStatus
} from "@/services/moduleService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { getProfile } from "@/services/profileService";

// Estilos de Botão Padronizados
const primaryButtonClass = "bg-trilha-orange text-white font-semibold rounded-full px-8 py-3 text-base shadow-md hover:shadow-lg hover:bg-trilha-orange-dark transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 justify-center";
const secondaryButtonClass = "bg-white text-gray-700 font-semibold border border-gray-200 rounded-full px-6 py-2 shadow-md hover:shadow-lg hover:bg-gray-50 transform hover:-translate-y-px transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 justify-center";
const celebrationButtonClass = "bg-green-600 text-white font-semibold rounded-full px-8 py-3 text-base shadow-md hover:shadow-lg hover:bg-green-700 transition-all duration-300 ease-in-out flex items-center gap-2 justify-center";

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const moduleId = parseInt(id || "1");
  const [userId, setUserId] = useState<string | null>(null);
  const [phaseStatuses, setPhaseStatuses] = useState<{[key: number]: PhaseStatus}>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [moduleProgress, setModuleProgress] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const userId = data.user.id;
        setUserId(userId);
        const userProfile = await getProfile(userId);
        setProfile(userProfile);
      } else {
        navigate("/login");
      }
    };
    getUser();
  }, [navigate]);

  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => getModuleById(moduleId),
    enabled: !!moduleId,
  });

  const { data: phases = [], isLoading: isLoadingPhases } = useQuery({
    queryKey: ['phases', moduleId],
    queryFn: () => getPhasesByModuleId(moduleId),
    enabled: !!moduleId,
  });

  useEffect(() => {
    const fetchModuleData = async () => {
      if (!userId || !moduleId) return;
      try {
        const progress = await getModuleProgress(userId, moduleId);
        setModuleProgress(progress);
      } catch (error) {
        console.error("Erro ao buscar progresso do módulo:", error);
      }
    };
    fetchModuleData();
  }, [userId, moduleId, phaseStatuses]);

  useEffect(() => {
    const fetchPhaseStatuses = async () => {
      if (!userId || phases.length === 0) {
        setIsLoadingStatuses(false);
        return;
      }
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

  const completedPhases = phases.filter(p => phaseStatuses[p.id] === "completed").length;
  const isModuleComplete = phases.length > 0 && completedPhases === phases.length;

  const startModule = () => {
    if (!phases || phases.length === 0) {
      toast.error("Não há fases disponíveis neste módulo.");
      return;
    }
    const firstIncompletePhase = phases.find(phase => phaseStatuses[phase.id] !== "completed");
    const targetPhase = firstIncompletePhase || phases[0];
    if (targetPhase) {
      navigate(`/fase/${moduleId}/${targetPhase.id}`);
    }
  };
  
  // Define o texto e o estilo do botão principal dinamicamente
  let mainButtonText = "Iniciar Módulo";
  let mainButtonStyle = primaryButtonClass;
  let MainButtonIcon = PlayCircle;

  if (isModuleComplete) {
    mainButtonText = "Revisar Módulo";
    mainButtonStyle = secondaryButtonClass;
    MainButtonIcon = RefreshCw;
  } else if (moduleProgress > 0) {
    mainButtonText = "Continuar Módulo";
  }

  if (isLoadingModule || isLoadingPhases || isLoadingStatuses) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50">
        <Header title="Módulo não encontrado" />
        <div className="container px-4 py-6 text-center">
          <p className="text-gray-500">O módulo que você está procurando não foi encontrado.</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <Header title={module.name || "Módulo"} />

      <div className="container px-4 py-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center rounded-full bg-orange-50 text-3xl shadow-sm">
              {module.emoji || "📚"}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{module.name || "Módulo"}</h2>
              <p className="text-sm text-gray-600 mt-1">{module.description || "Descrição do módulo"}</p>
            </div>
          </div>
          
          <div>
            <div className="mb-1 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-gray-700">Progresso</span>
              <span className="text-lg font-bold text-trilha-orange">{Math.round(moduleProgress)}%</span>
            </div>
            <Progress value={moduleProgress} className="h-3 bg-gray-200 [&>*]:bg-trilha-orange" />
          </div>
          
          <div className="pt-2 flex justify-center">
            <Button onClick={startModule} className={`${mainButtonStyle} w-full sm:w-auto`}>
              <MainButtonIcon className="mr-2 h-5 w-5" />
              {mainButtonText}
            </Button>
          </div>
        </div>

        {isModuleComplete && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-lg space-y-3">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-bold text-green-800">Módulo completo, {profile?.full_name?.split(' ')[0] || "Aluno"}!</h3>
            <p className="text-sm text-green-700 max-w-md mx-auto">
              Parabéns! Você concluiu todas as fases deste módulo. Continue sua jornada de aprendizado.
            </p>
            <div className="pt-2 flex justify-center">
              <Button onClick={() => navigate("/modulos")} className={`${celebrationButtonClass} w-full sm:w-auto`}>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Ver outros módulos
              </Button>
            </div>
          </div>
        )}

        {module.content && (
           <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sobre este Módulo</h3>
              <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: module.content }} />
           </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModuleDetailPage;