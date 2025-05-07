import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, ArrowRight, Heart } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import UserLevel from "@/components/UserLevel";
import DailyTask from "@/components/DailyTask";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from '@tanstack/react-query';
import { getModules, Module, getModuleProgress, isModuleCompleted, getUserNextPhase } from "@/services/moduleService";
import { getProfile, updateLoginStreak, updateUserXp } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProgressBar from "@/components/ProgressBar";

const DashboardPage = () => {
  const { toast } = useToast();
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{[key: number]: number}>({});
  const [completedModules, setCompletedModules] = useState<{[key: number]: boolean}>({});

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
            // Atualiza o streak quando o usuário faz login
            const streak = await updateLoginStreak(userId);
            setStreakDays(streak);
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

  // Buscar progresso e status de conclusão para cada módulo
  useEffect(() => {
    const fetchProgress = async () => {
      if (!userId || modules.length === 0) return;
      
      const progressData: {[key: number]: number} = {};
      const completedData: {[key: number]: boolean} = {};
      
      // Buscar progresso e status de cada módulo
      for (const module of modules) {
        try {
          const progress = await getModuleProgress(userId, module.id);
          const completed = await isModuleCompleted(userId, module.id);
          
          progressData[module.id] = progress;
          completedData[module.id] = completed;
        } catch (error) {
          console.error(`Error fetching progress for module ${module.id}:`, error);
        }
      }
      
      setModuleProgress(progressData);
      setCompletedModules(completedData);
    };
    
    fetchProgress();
  }, [userId, modules]);

  const handleDailyTask = async () => {
    if (!dailyCompleted && userId) {
      setDailyCompleted(true);
      
      // Adicionar XP pela tarefa diária
      const xpGained = 50;
      await updateUserXp(userId, xpGained);
      
      toast({
        title: "Missão do Dia completada!",
        description: `Você ganhou +${xpGained} XP! 🔥`,
        duration: 3000,
      });
      
      // Atualizar o perfil após ganhar XP
      const updatedProfile = await getProfile(userId);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
  };

  // Determine if a module should be locked
  // In dashboard, we only show first 3 modules, and use same logic as ModulesPage
  const isModuleLocked = (index: number, moduleId: number) => {
    if (index === 0) return false; // First module is always unlocked
    
    // If this module already has progress, it's unlocked
    if (moduleProgress[moduleId] > 0) return false;
    
    // Check if previous module is completed
    const prevModuleId = modules[index - 1]?.id;
    if (prevModuleId && completedModules[prevModuleId]) {
      return false; // Previous module is completed, so this one is unlocked
    }
    
    return true; // In all other cases, lock the module
  };

  // Find the next module to continue (highest progress that's not complete)
  const findContinueModule = () => {
    if (!modules.length) return null;
    
    // First look for modules in progress
    const inProgressModules = modules.filter(
      module => moduleProgress[module.id] > 0 && moduleProgress[module.id] < 100
    );
    
    if (inProgressModules.length) {
      // Sort by progress descending to find the one with most progress
      return inProgressModules.sort(
        (a, b) => moduleProgress[b.id] - moduleProgress[a.id]
      )[0];
    }
    
    // If none in progress, find first unlocked but not started module
    for (let i = 0; i < modules.length; i++) {
      if (!isModuleLocked(i, modules[i].id) && moduleProgress[modules[i].id] === 0) {
        return modules[i];
      }
    }
    
    return null; // All modules either completed or locked
  };

  const continueModule = findContinueModule();

  if (isLoading || !profile) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* User stats bar */}
      <div className="bg-white shadow-sm py-3 px-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-trilha-orange">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Foto de perfil" />
              ) : (
                <AvatarFallback className="bg-trilha-orange/20 text-trilha-orange">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-lg font-bold">{profile.xp || 0} XP</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-red-500">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-bold">5</span>
            </div>
            
            <div className="flex items-center gap-1 text-amber-500">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{streakDays}</span>
            </div>
            
            <Badge variant="outline" className="font-bold text-blue-500 border-blue-200 bg-blue-50">
              {profile.level || 1}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Continue Learning Section */}
        {continueModule && (
          <div>
            <h2 className="text-xl font-bold mb-3">Continue Aprendendo</h2>
            <Card className="mb-4 overflow-hidden border-none shadow-md">
              <CardContent className="p-0">
                <div className="bg-amber-50 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{continueModule.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">Continue de onde parou</p>
                      
                      <Link 
                        to={`/modulo/${continueModule.id}`}
                        className="bg-trilha-orange text-white px-4 py-2 rounded-full text-sm font-medium inline-flex items-center mt-2"
                      >
                        Continuar
                      </Link>
                    </div>
                    <div className="text-3xl">
                      {continueModule.emoji || "🚀"}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <ProgressBar 
                      progress={moduleProgress[continueModule.id] || 0} 
                      showIcon={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Your Course Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Sua Trilha</h2>
            <Link to="/modulos" className="text-sm font-medium text-trilha-orange flex items-center">
              Ver tudo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                emoji={module.emoji}
              />
            ))}
          </div>
        </div>

        {/* Streak Box */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-orange-100">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium">Sequência de dias</h3>
                <p className="text-sm text-gray-600">Continue estudando para manter sua sequência!</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white px-3 py-1 text-lg font-bold text-trilha-orange">
              {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
            </Badge>
          </div>
        </div>

        {/* Daily Task */}
        <DailyTask 
          completed={dailyCompleted}
          xpReward={50}
          onClick={handleDailyTask}
        />

        {/* Leaderboard Preview */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Ranking</h2>
            <Link to="/comunidade" className="text-sm font-medium text-trilha-orange flex items-center">
              Ver tudo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-100 text-amber-800">
                        1
                      </AvatarFallback>
                    </Avatar>
                    <Trophy className="h-4 w-4 absolute -bottom-1 -right-1 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Você</p>
                    <p className="text-xs text-gray-500">Liga Bronze</p>
                  </div>
                </div>
                <p className="font-bold text-lg">{profile.xp || 0} XP</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default DashboardPage;
