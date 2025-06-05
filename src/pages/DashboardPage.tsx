import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Clock, Gift, PartyPopper } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { getModules, Module, getUserNextPhase, getModuleProgress, isModuleCompleted } from "@/services/moduleService";
import { getProfile } from "@/services/profileService";
import { updateUserXpFromModules } from "@/services/rankingService";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import ProgressBar from "@/components/ProgressBar";
import ModuleCard from "@/components/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";

// Componente de Skeleton para um loading state mais elegante
const DashboardSkeleton = () => (
  <div className="pb-20 min-h-screen bg-white">
    <div className="bg-[#e36322] px-4 pt-6 pb-4 rounded-b-3xl">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-7 w-40 bg-white/20" />
        <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
      </div>
      <Skeleton className="h-10 w-full rounded-full bg-white/10" />
    </div>
    <div className="container px-4 py-5 space-y-6">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg mt-2" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
    <BottomNavigation />
  </div>
);

const DashboardPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nextPhase, setNextPhase] = useState<any>(null);
  const [nextModule, setNextModule] = useState<Module | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{[key: number]: number}>({});
  const [completedModules, setCompletedModules] = useState<{[key: number]: boolean}>({});
  const [totalProgress, setTotalProgress] = useState(0);
  const [dailyXpClaimed, setDailyXpClaimed] = useState(false);
  const [dailyXpButtonDisabled, setDailyXpButtonDisabled] = useState(false);
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
            const today = new Date().toISOString().split('T')[0];
            const { data: claimData, error: claimError } = await supabase
              .from('daily_xp_claims').select('claimed_at').eq('user_id', userId).eq('claimed_at', today);

            if (claimError) console.error("Erro ao verificar XP diário:", claimError);
            
            if (claimData && claimData.length > 0) {
              setDailyXpClaimed(true);
              setDailyXpButtonDisabled(true);
            } else {
              setDailyXpClaimed(false);
              setDailyXpButtonDisabled(false);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Não foi possível carregar seu perfil.");
      }
    };
    fetchUserProfile();
  }, []);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    enabled: !!userId,
  });

  useEffect(() => {
    const fetchNextContent = async () => {
      if (!userId || modules.length === 0) return;
      try {
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
      if (modules.length > 0) {
        const overallProgress = Math.round(totalProgressSum / modules.length);
        setTotalProgress(overallProgress);
      }
    };
    fetchProgressData();
  }, [userId, modules]);

  const groupedModules = modules.reduce<Record<string, Module[]>>((acc, module) => {
    const type = module.type || "autoconhecimento";
    if (!acc[type]) acc[type] = [];
    acc[type].push(module);
    return acc;
  }, {});

  const isModuleLocked = (index: number, moduleId: number) => {
    if (index === 0) return false;
    if (moduleProgress[moduleId] > 0) return false;
    const prevModuleId = modules[index - 1]?.id;
    return !(prevModuleId && completedModules[prevModuleId]);
  };

  const getModuleTypeTitle = (type: string) => {
    const types: Record<string, string> = {
      autoconhecimento: "Autoconhecimento", empatia: "Empatia",
      growth: "Desenvolvimento Pessoal", comunicacao: "Comunicação", futuro: "Futuro"
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleClaimDailyXp = async () => {
    if (!userId || dailyXpClaimed) return;
    setDailyXpButtonDisabled(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existingClaim } = await supabase
        .from('daily_xp_claims').select('id').eq('user_id', userId).eq('claimed_at', today);

      if (existingClaim && existingClaim.length > 0) {
        setDailyXpClaimed(true);
        toast.info("Você já reclamou seu XP diário hoje!");
        return;
      }

      const { data } = await supabase.from('profiles').select('xp, level').eq('id', userId).single();
      const currentXp = data?.xp || 0;
      const currentLevel = data?.level || 1;
      const newXp = currentXp + 50;
      const newLevel = Math.floor(newXp / 100) + 1;
      const leveledUp = newLevel > currentLevel;

      await supabase.from('profiles').update({ xp: newXp, level: newLevel }).eq('id', userId);
      await supabase.from('daily_xp_claims').insert({ user_id: userId, claimed_at: today, xp_amount: 50 });

      setProfile(prev => ({ ...prev, xp: newXp, level: newLevel }));
      setDailyXpClaimed(true);
      if (userId) await updateUserXpFromModules(userId);

      if (leveledUp) {
        const mensagemNivel = `🎉 INCRÍVEL! Você subiu para o nível ${newLevel}! Sua dedicação está dando frutos! 🌟`;
        toast.success(mensagemNivel, {
          duration: 5000,
          icon: <PartyPopper className="h-5 w-5" />
        });
      } else {
        const mensagensMotivacionais = [
          "Incrível! +50 XP para sua jornada! 🚀",
          "Você está arrasando! Continue assim! 💪",
          "Parabéns pela dedicação! Seu esforço diário faz a diferença! 🏆"
        ];
        const mensagemAleatoria = mensagensMotivacionais[Math.floor(Math.random() * mensagensMotivacionais.length)];
        toast.success(mensagemAleatoria);
      }
    } catch (error) {
      console.error("Erro ao reclamar XP diário:", error);
      toast.error("Não foi possível reclamar seu XP diário.");
      setDailyXpButtonDisabled(false);
    }
  };

  if (isLoading || !profile) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="pb-20 min-h-screen bg-white">
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
        <div className="relative mb-2">
          <Input
            className="bg-white/10 border-0 text-white placeholder-white/60 rounded-full pl-10 pr-4 py-2"
            placeholder="Pesquisar"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
        </div>
      </div>

      <div className="container px-4 py-5 space-y-6">
        <Card className={`border-none shadow-md overflow-hidden transition-all duration-300 ${
            dailyXpClaimed ? 'bg-gradient-to-r from-green-100 to-blue-100' : 'bg-gradient-to-r from-purple-100 to-blue-100'
          }`}>
            <CardContent className="p-3 sm:p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-base sm:text-lg">Bônus Diário</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {dailyXpClaimed 
                      ? "Você já recebeu seu XP hoje! Volte amanhã!"
                      : "Ganhe 50 XP pelo seu acesso hoje!"
                    }
                  </p>
                </div>
                {dailyXpClaimed ? (
                  <div className="bg-green-500 text-white rounded-full p-2">
                    <Gift className="h-4 w-4" />
                  </div>
                ) : (
                  <Button 
                    onClick={handleClaimDailyXp}
                    disabled={dailyXpButtonDisabled}
                    className="bg-[#9b87f5] hover:bg-[#8a74e8] text-white"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Receber XP
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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

        {nextModule && nextPhase && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{profile?.full_name?.split(' ')[0] || "Aluno"}, vamos continuar?</h2>
            </div>
            <Card className="overflow-hidden border-none shadow-md rounded-xl">
              <CardContent className="p-0">
                <div className="bg-[#FFF6F0] p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#E36322] text-white text-xs">{getModuleTypeTitle(nextModule.type)}</Badge>
                        {nextPhase.type && <Badge variant="outline" className="text-xs">{nextPhase.type === 'video' ? 'Vídeo' : nextPhase.type === 'text' ? 'Texto' : nextPhase.type === 'quiz' ? 'Quiz' : 'Conteúdo'}</Badge>}
                      </div>
                      <h3 className="font-bold text-base text-gray-800 mt-2">{nextModule.name}: {nextPhase.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{nextPhase.description || 'Continue seu aprendizado'}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{nextPhase.duration || 10} mins</span>
                      </div>
                    </div>
                  <div className="mt-4">
                    <Link to={`/modulo/${nextModule.id}`} className="bg-[#E36322] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">Continuar</Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Módulos para você</h2>
            <Link to="/modulos" className="text-xs sm:text-sm font-medium text-[#E36322] flex items-center">
              Ver tudo <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Link>
          </div>
          <div className="flex flex-col space-y-3">
            {modules.slice(0, 4).map((module, index) => (
              <ModuleCard 
                key={module.id} id={module.id} title={module.name}
                type={module.type || "autoconhecimento"}
                progress={moduleProgress[module.id] || 0}
                completed={completedModules[module.id] || false}
                locked={isModuleLocked(index, module.id)}
                description={module.description} vertical={true}
              />
            ))}
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default DashboardPage;