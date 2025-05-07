
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Calendar } from "lucide-react";
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

  if (isLoading || !profile) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="🗺️ Painel da Jornada" showBackButton={false} />

      <div className="container px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-trilha-orange">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Foto de perfil" />
              ) : (
                <AvatarFallback className="bg-trilha-orange/20 text-trilha-orange">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-trilha-orange text-xs font-bold text-white shadow-sm">
              {profile.level || 1}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-bold">Olá, {profile.full_name || "Explorador(a)"}!</h2>
            <UserLevel level={profile.level || 1} xp={profile.xp || 0} nextLevelXp={(profile.level || 1) * 100} />
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-orange-100">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium">Sequência de dias</h3>
              <p className="text-sm text-gray-600">Você está em uma sequência!</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white px-3 py-1 text-lg font-bold text-trilha-orange">
            {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
          </Badge>
        </div>

        <DailyTask 
          completed={dailyCompleted}
          xpReward={50}
          onClick={handleDailyTask}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Sua Trilha</h2>
            <Link to="/modulos" className="text-sm font-medium text-trilha-orange">
              Ver tudo
            </Link>
          </div>

          <div className="grid gap-4">
            {modules.slice(0, 3).map((module, index) => (
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

        <div className="mt-6">
          <Link
            to="/recompensas"
            className="card-trilha flex items-center gap-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-trilha-orange bg-opacity-10 text-2xl">
              🏆
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Central de Recompensas</h3>
              <p className="text-sm text-gray-600">
                Você tem 3 emblemas novos para desbloquear!
              </p>
            </div>
            <Zap className="h-5 w-5 animate-pulse text-trilha-orange" />
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default DashboardPage;
