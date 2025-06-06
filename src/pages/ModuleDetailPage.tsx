import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Progress } from "@/components/ui/progress";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { 
    getModuleById, 
    getPhasesByModuleId, 
    getUserPhaseStatus, 
    getModuleProgress, 
    getModules, 
    isModuleCompleted,
    Phase, 
    PhaseStatus, 
    Module 
} from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, RefreshCw, ArrowLeft, Lock, Video, FileText, HelpCircle, Star } from "lucide-react";
import { getProfile, Profile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// --- COMPONENTES AUXILIARES ---

const PhaseCard = ({ phase, status, isLocked, onClick }: { phase: Phase, status: PhaseStatus, isLocked: boolean, onClick: () => void }) => {
  const isCompleted = status === 'completed';

  // Função para traduzir o tipo da fase
  const getPhaseTypeInPortuguese = (type: string | null): string => {
      switch (type) {
          case 'video': return 'Vídeo';
          case 'text': return 'Texto';
          case 'quiz': return 'Quiz';
          case 'challenge': return 'Desafio';
          default: return 'Atividade';
      }
  };

    const getIcon = () => {
        if (isLocked) return <Lock className="h-5 w-5 text-slate-400" />;
        if (isCompleted) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        
        switch (phase.type) {
            case 'video': return <Video className="h-5 w-5 text-orange-600" />;
            case 'text': return <FileText className="h-5 w-5 text-orange-600" />;
            case 'quiz': return <HelpCircle className="h-5 w-5 text-orange-600" />;
            case 'challenge': return <Star className="h-5 w-5 text-orange-600" />;
            default: return <PlayCircle className="h-5 w-5 text-orange-600" />;
        }
    };

    return (
        <button 
            onClick={onClick} 
            disabled={isLocked}
            className="w-full flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:bg-slate-50 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed group"
        >
            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full transition-colors ${isLocked ? 'bg-slate-200' : (isCompleted ? 'bg-green-100' : 'bg-orange-100')}`}>
                {getIcon()}
            </div>
            <div className={`flex-1 text-left transition-opacity ${isLocked ? 'opacity-50' : ''}`}>
                <p className="font-semibold text-slate-800">{phase.name}</p>
                <p className="text-xs text-slate-500 capitalize">{phase.duration || 5} min • {getPhaseTypeInPortuguese(phase.type)}</p>
            </div>
        </button>
    );
};

const ModuleDetailSkeleton = () => (
    <div className="min-h-screen bg-slate-50 animate-pulse">
        <header className="p-4 sm:p-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
                    <Skeleton className="h-7 w-48 bg-slate-200" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-slate-200" />
            </div>
        </header>
        <main className="container px-4 py-2 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl bg-slate-200" />
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl bg-slate-200" />
                <Skeleton className="h-16 w-full rounded-xl bg-slate-200" />
                <Skeleton className="h-16 w-full rounded-xl bg-slate-200" />
            </div>
        </main>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function ModuleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");

    const { data, isLoading, error } = useQuery({
        queryKey: ['moduleDetailData', moduleId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                throw new Error("Usuário não autenticado.");
            }

            const [userProfile, module, allModules, phases] = await Promise.all([
                getProfile(user.id),
                getModuleById(moduleId),
                getModules(),
                getPhasesByModuleId(moduleId)
            ]);

            if (!module) throw new Error("Módulo não encontrado.");

            const progress = await getModuleProgress(user.id, moduleId);
            
            const statusPromises = phases.map(phase => getUserPhaseStatus(user.id, phase.id));
            const statuses = await Promise.all(statusPromises);
            const statusMap: {[key: number]: PhaseStatus} = {};
            phases.forEach((phase, index) => {
                statusMap[phase.id] = (statuses[index] as PhaseStatus) || "notStarted";
            });
            
            const completedModulesMap: {[key: number]: boolean} = {};
            for (const m of allModules) {
                completedModulesMap[m.id] = await isModuleCompleted(user.id, m.id);
            }
            
            return { userProfile, module, allModules, phases, progress, statusMap, completedModulesMap };
        },
        enabled: !!moduleId,
        retry: 1,
    });

    useEffect(() => {
        if (error) {
            toast.error("Erro ao carregar o módulo.");
            navigate('/modulos');
        }
    }, [error, navigate]);

    if (isLoading) return <ModuleDetailSkeleton />;
    if (!data) return <div className="p-4 text-center">Módulo não encontrado.</div>;
    
    const { userProfile, module, allModules, phases, progress, statusMap, completedModulesMap } = data;
    
    const isPhaseLocked = (phaseIndex: number): boolean => {
        if (phaseIndex === 0) return false;
        const prevPhaseId = phases[phaseIndex - 1]?.id;
        if (!prevPhaseId) return true;
        return statusMap[prevPhaseId] !== 'completed';
    };

    const startModule = () => {
        const firstIncompletePhase = phases.find((_, index) => !isPhaseLocked(index) && statusMap[phases[index].id] !== "completed");
        const targetPhase = firstIncompletePhase || phases[0];
        
        if (targetPhase) {
            const targetIndex = phases.findIndex(p => p.id === targetPhase.id);
            if(isPhaseLocked(targetIndex)) {
                toast.error("Você precisa completar a fase anterior primeiro!");
                return;
            }
            navigate(`/fase/${moduleId}/${targetPhase.id}`);
        } else {
            toast.info("Não há fases para iniciar ou todas já foram concluídas.");
        }
    };

    const isModuleComplete = phases.length > 0 && phases.every(p => statusMap[p.id] === 'completed');

    return (
        <div className="pb-24 min-h-screen bg-slate-50">
            <header className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/modulos')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 truncate">{module.name}</h1>
                    </div>
                    <Link to="/perfil">
                        <img src={userProfile?.avatar_url || ''} alt="Perfil" className="h-12 w-12 rounded-full border-2 border-white shadow-md"/>
                    </Link>
                </div>
            </header>

            <main className="container px-4 py-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/50 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                            {module.emoji || "📚"}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800">{module.name}</h2>
                            <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                        </div>
                    </div>
                    <Progress value={progress} className="h-3 bg-gray-200 [&>*]:bg-orange-500" />
                    <Button onClick={startModule} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3">
                        {isModuleComplete ? <RefreshCw className="mr-2 h-5 w-5"/> : <PlayCircle className="mr-2 h-5 w-5"/>}
                        {isModuleComplete ? "Revisar Módulo" : progress > 0 ? "Continuar Módulo" : "Iniciar Módulo"}
                    </Button>
                </div>
                
                {phases.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-800">Fases da Trilha</h2>
                        {phases.map((phase, index) => (
                            <PhaseCard 
                                key={phase.id} 
                                phase={phase} 
                                status={statusMap[phase.id]} 
                                isLocked={isPhaseLocked(index)}
                                onClick={() => navigate(`/fase/${moduleId}/${phase.id}`)}
                            />
                        ))}
                    </div>
                )}
            </main>
            <BottomNavigation />
        </div>
    );
};