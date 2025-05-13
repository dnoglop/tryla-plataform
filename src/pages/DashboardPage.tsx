
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Clock } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from '@tanstack/react-query';
import { getModules, Module, getUserNextPhase, getModuleProgress, isModuleCompleted } from "@/services/moduleService";
import { getProfile } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import ProgressBar from "@/components/ProgressBar";
import ModuleCard from "@/components/ModuleCard";

const DashboardPage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nextPhase, setNextPhase] = useState<any>(null);
  const [nextModule, setNextModule] = useState<Module | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{[key: number]: number}>({});
  const [completedModules, setCompletedModules] = useState<{[key: number]: boolean}>({});
  const [totalProgress, setTotalProgress] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const userId = data.user.id;
          setUserId(userId);
          const userProfile = await getProfile(userId);
          
          if (userProfile) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu perfil",
          variant: "destructive"
        });
      }
    };

    fetchUserProfile();
  }, [toast]);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    enabled: !!userId,
  });

  // Load next module and phase for the user
  useEffect(() => {
    const fetchNextContent = async () => {
      if (!userId || modules.length === 0) return;

      try {
        // Find first incomplete module
        for (const module of modules) {
          const isCompleted = await isModuleCompleted(userId, module.id);
          if (!isCompleted) {
            const nextPhaseData = await getUserNextPhase(userId, module.id);
            if (nextPhaseData) {
              setNextPhase(nextPhaseData);
              setNextModule(module);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching next content:", error);
      }
    };

    fetchNextContent();
  }, [userId, modules]);

  // Calculate progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!userId || modules.length === 0) return;
      
      const progressData: {[key: number]: number} = {};
      const completedData: {[key: number]: boolean} = {};
      
      let totalProgressSum = 0;
      
      for (const module of modules) {
        try {
          const progress = await getModuleProgress(userId, module.id);
          const completed = await isModuleCompleted(userId, module.id);
          
          progressData[module.id] = progress;
          completedData[module.id] = completed;
          totalProgressSum += progress;
        } catch (error) {
          console.error(`Error loading progress for module ${module.id}:`, error);
        }
      }
      
      setModuleProgress(progressData);
      setCompletedModules(completedData);
      
      // Calculate total progress
      if (modules.length > 0) {
        const overallProgress = Math.round(totalProgressSum / modules.length);
        setTotalProgress(overallProgress);
      }
    };
    
    fetchProgressData();
  }, [userId, modules]);

  // Group modules by type for better organization
  const groupedModules = modules.reduce<Record<string, Module[]>>((acc, module) => {
    const type = module.type || "autoconhecimento";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(module);
    return acc;
  }, {});

  // Helper for module locking logic
  const isModuleLocked = (index: number, moduleId: number) => {
    if (index === 0) return false;
    if (moduleProgress[moduleId] > 0) return false;
    const prevModuleId = modules[index - 1]?.id;
    if (prevModuleId && completedModules[prevModuleId]) {
      return false;
    }
    return true;
  };

  // Translate module type to human readable format
  const getModuleTypeTitle = (type: string) => {
    const types: Record<string, string> = {
      autoconhecimento: "Autoconhecimento",
      empatia: "Empatia",
      growth: "Desenvolvimento Pessoal",
      comunicacao: "Comunicação",
      futuro: "Futuro"
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading || !profile) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[#e36322] px-4 pt-6 pb-4 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-white text-lg font-semibold">Olá, {profile?.full_name?.split(' ')[0] || "Aluno"}</h2>
          </div>
          <Avatar className="h-10 w-10 border-2 border-white">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Foto de perfil" />
            ) : (
              <AvatarFallback className="bg-white/20 text-white">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-2">
          <Input
            className="bg-white/10 border-0 text-white placeholder-white/60 rounded-full pl-10 pr-4 py-2"
            placeholder="Pesquisar"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
        </div>
      </div>

      <div className="container px-4 py-5 space-y-6">
        {/* Overall Progress Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-3 sm:p-5 bg-[#FFF6F0]">
            <h2 className="mb-2 font-bold text-base sm:text-lg">Progresso Total</h2>
            <ProgressBar 
              progress={totalProgress} 
              className="h-2 sm:h-3" 
              showIcon={totalProgress === 100}
              compact={isMobile}
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs sm:text-sm text-gray-600">{totalProgress}% completo</p>
              {totalProgress < 100 && (
                <span className="text-xs sm:text-sm font-medium text-[#E36322]">Continue!</span>
              )}
              {totalProgress === 100 && (
                <span className="text-xs sm:text-sm font-medium text-green-600">Concluído!</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Continue Learning Section */}
        {nextModule && nextPhase && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{profile?.full_name?.split(' ')[0] || "Aluno"}, vamos continuar os estudos?</h2>
            </div>
            
            <Card className="overflow-hidden border-none shadow-md rounded-xl">
              <CardContent className="p-0">
                <div className="bg-[#FFF6F0] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#E36322] text-white text-xs">{getModuleTypeTitle(nextModule.type)}</Badge>
                        {nextPhase.type && (
                          <Badge variant="outline" className="text-xs">
                            {nextPhase.type === 'video' ? 'Vídeo' : 
                             nextPhase.type === 'text' ? 'Texto' : 
                             nextPhase.type === 'quiz' ? 'Quiz' : 'Conteúdo'}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-gray-800 mt-2">{nextModule.name}: {nextPhase.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{nextPhase.description || 'Continue seu aprendizado'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{nextPhase.duration || 10} mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link 
                      to={`/modulo/${nextModule.id}`}
                      className="bg-[#E36322] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium inline-flex items-center"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* For You Section - Featured Modules */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Módulos bem legais para você</h2>
            <Link to="/modulos" className="text-xs sm:text-sm font-medium text-[#E36322] flex items-center">
              Ver tudo
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </div>

          <div className="flex flex-col space-y-3">
            {modules.slice(0, 4).map((module, index) => (
              <ModuleCard 
                key={module.id}
                id={module.id}
                title={module.name}
                type={module.type || "autoconhecimento"}
                progress={moduleProgress[module.id] || 0}
                completed={completedModules[module.id] || false}
                locked={isModuleLocked(index, module.id)}
                description={module.description}
                vertical={true}
              />
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div>
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-800">{profile?.full_name?.split(' ')[0] || "Aluno"}, se liga nesses conselhos importantes!</h2>
          </div>

          <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-4">
              <h3 className="font-bold text-base text-gray-800">Dicas maneiras para um melhor aprendizado</h3>
              <p className="text-xs text-gray-600 mt-1 mb-3">
                Aprenda como otimizar seus estudos com estas estratégias comprovadas
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-[#E36322]"></div>
                  <span>Estude por 25 minutos e descanse por 5</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-[#E36322]"></div>
                  <span>Faça anotações durante as aulas</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-[#E36322]"></div>
                  <span>Revise seu conteúdo regularmente</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default DashboardPage;
