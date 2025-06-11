// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Imports de ícones e componentes
import { Linkedin, Edit, Trophy, Star, BookCheck, Flame, ChevronRight, LogOut, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, updateUserStreak, Profile } from "@/services/profileService"; 
import { getModules, isModuleCompleted, Module as ModuleType } from "@/services/moduleService";
import { getUserRanking, RankingUser } from "@/services/rankingService";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";
import BottomNavigation from "@/components/BottomNavigation";
import { profile } from "console";

// --- INTERFACES LOCAIS ---
interface StatsCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: string | number;
  label: string;
}

interface ProfilePageData {
  userProfile: Profile;
  completedCount: number;
  userRank: number;
}

// --- COMPONENTES AUXILIARES ESTILIZADOS ---

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, value, label }) => (
  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-white p-4 text-center shadow-sm border border-slate-200/50 min-h-[100px]">
    <Icon className="h-6 w-6 text-orange-500 mb-1.5" aria-hidden="true" />
    <p className="text-xl font-bold text-slate-800">{value}</p>
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
  </div>
);

const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-100 animate-pulse">
    <header className="p-4 sm:p-6 lg:p-8 bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md bg-slate-200" />
          <Skeleton className="h-5 w-32 rounded-md bg-slate-200" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20 rounded-full bg-slate-200" />
          <Skeleton className="h-16 w-16 rounded-full bg-slate-200" />
        </div>
      </div>
    </header>
    <main className="px-4 sm:px-6 lg:px-8 pb-24 max-w-4xl mx-auto mt-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-2xl bg-slate-200" />
        <Skeleton className="h-24 rounded-2xl bg-slate-200" />
        <Skeleton className="h-24 rounded-2xl bg-slate-200" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
      <Skeleton className="h-60 w-full rounded-2xl bg-slate-200" />
      <Skeleton className="h-12 w-full rounded-xl bg-slate-200" />
      <Skeleton className="h-12 w-full rounded-xl bg-slate-200" />
    </main>
  </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
    <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50 max-w-md w-full">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        Erro ao carregar perfil
      </h2>
      <p className="text-slate-600 mb-6">
        Não foi possível carregar suas informações. Tente novamente.
      </p>
      <Button 
        onClick={onRetry}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  </div>
);

const ProfileHeader: React.FC<{ profile: Profile }> = ({ profile }) => (
  <header className="p-4 sm:p-6 lg:p-8 bg-white shadow-sm sticky top-0 z-10 border-b border-slate-200">
    <div className="flex justify-between items-center max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {profile.full_name || 'Seu Perfil'}
        </h1>
        <p className="text-sm text-slate-500">
          @{profile.username || 'username'}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 border border-orange-200">
          <Flame className="h-6 w-6 text-red-500" aria-hidden="true" />
          <span className="text-lg font-bold text-orange-600">
            {profile.streak_days || 0}
          </span>
        </div>
        <Link to="/editar-perfil" aria-label="Editar perfil">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg transition-transform hover:scale-110 ring-2 ring-orange-300">
            <AvatarImage 
              src={profile.avatar_url || undefined} 
              alt={`Avatar de ${profile.full_name}`}
            />
            <AvatarFallback className="bg-orange-100 text-orange-500 text-2xl font-semibold">
              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  </header>
);

const AboutSection: React.FC<{ profile: Profile }> = ({ profile }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/50">
    <h3 className="text-lg font-bold text-slate-700 mb-2">Sobre Mim</h3>
    <p className="text-sm text-slate-600 leading-relaxed">
      {profile.bio || "Nenhuma biografia informada ainda."}
    </p>
    {profile.linkedin_url && (
      <a 
        href={profile.linkedin_url.startsWith('http') ? profile.linkedin_url : `https://${profile.linkedin_url}`}
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold mt-3 hover:text-blue-700 transition-colors"
        aria-label="Abrir perfil no LinkedIn"
      >
        <Linkedin className="h-4 w-4" aria-hidden="true" />
        Ver perfil no LinkedIn
      </a>
    )}
  </div>
);

const ProfileActions: React.FC<{ onSignOut: () => Promise<void> }> = ({ onSignOut }) => (
  <div className="space-y-3 pt-4">
    <Link 
      to="/editar-perfil" 
      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:bg-slate-50 border border-slate-200/50 group"
      aria-label="Editar perfil"
    >
      <div className="flex items-center gap-4">
        <Edit className="h-5 w-5 text-orange-500" aria-hidden="true" />
        <span className="font-semibold text-slate-700">Editar Perfil</span>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" aria-hidden="true" />
    </Link>
    
    <Button 
      variant="ghost" 
      className="w-full justify-start gap-3 p-4 h-auto text-base font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-xl border border-transparent hover:border-red-100" 
      onClick={onSignOut}
      aria-label="Sair da conta"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
      Sair da conta
    </Button>
  </div>
);

// --- FUNÇÃO HELPER PARA CRIAR O DELAY ---
const createDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HOOK PERSONALIZADO PARA DADOS DO PERFIL (COM A LÓGICA DE DELAY CORRIGIDA) ---
const useProfileData = (userId: string | null) => {
  return useQuery<ProfilePageData, Error>({
    queryKey: ['profilePageData', userId], 
    queryFn: async (): Promise<ProfilePageData> => {
      if (!userId) {
        throw new Error("ID do usuário não fornecido para a busca de dados.");
      }

      // Inicia a promessa de delay e a de busca de dados ao mesmo tempo
      const delayPromise = createDelay(1000); // 2000ms = 2 segundos
      
      const dataFetchPromise = (async () => {
        const [userProfileData, modulesData, rankingData] = await Promise.all([
          getProfile(userId),
          getModules(),
          getUserRanking("all")
        ]);

        if (!userProfileData) {
          throw new Error("Perfil do usuário não encontrado.");
        }

        let completedCount = 0;
        if (modulesData?.length) {
          const completionResults = await Promise.all(
            modulesData.map(module => isModuleCompleted(userId, module.id))
          );
          completedCount = completionResults.filter(Boolean).length;
        }
        
        const userPosition = rankingData?.findIndex((user: RankingUser) => user.id === userId);
        const userRank = userPosition !== undefined && userPosition !== -1 ? userPosition + 1 : 0;
        
        updateUserStreak(userId).catch(err => console.error("Falha ao atualizar streak em segundo plano:", err));
        
        return { userProfile: userProfileData, completedCount, userRank };
      })();

      // <<< LÓGICA CORRIGIDA PARA O DELAY E ERRO >>>
      // Espera o delay terminar, não importa o que aconteça com a busca de dados.
      await delayPromise;
      
      // AGORA, depois que o delay já passou, esperamos pela busca de dados.
      // Se a busca de dados falhou, o 'await' aqui vai lançar a exceção,
      // mas isso só acontece DEPOIS dos 2 segundos de delay.
      try {
        const result = await dataFetchPromise;
        return result;
      } catch (error) {
        // Relança o erro para o react-query, mas só depois do delay.
        console.error("Erro na busca de dados do perfil (após delay):", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    retry: 0, // Definir como 0 durante o desenvolvimento para ver o erro imediatamente na primeira tentativa
  });
};

// --- COMPONENTE PRINCIPAL ---
export default function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login', { replace: true });
      }
    };
    getCurrentUserId();
  }, [navigate]);

  const { data, isLoading, isError, refetch } = useProfileData(userId);

  const handleSignOut = async (): Promise<void> => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      
      queryClient.clear();
      
      toast.success(`Esperamos você de volta!`);
      navigate('/login', { replace: true });

    } catch (err: any) {
      toast.error("Erro ao sair da conta.");
      console.error("Erro no logout:", err.message);
    }
  };

  if (isLoading || !userId) {
    return <ProfileSkeleton />;
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }
  
  const { userProfile, completedCount, userRank } = data;

  return (
    <div className="min-h-screen bg-slate-100">
      <ProfileHeader profile={userProfile} />

      <main className="px-4 sm:px-6 lg:px-8 pb-24 max-w-4xl mx-auto mt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard icon={Trophy} value={userRank > 0 ? `${userRank}º` : "N/D"} label="Ranking Geral" />
            <StatsCard icon={Star} value={userProfile.xp || 0} label="XP Total" />
            <StatsCard icon={BookCheck} value={completedCount} label="Módulos Concluídos" />
          </div>

          <AboutSection profile={userProfile} />
          
          {userId && <WeeklyProgressChart streak={userProfile.streak_days || 0} userId={userId} />}

          <ProfileActions onSignOut={handleSignOut} />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}