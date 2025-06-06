
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Ícones e Componentes
import { 
  Linkedin, 
  Edit, 
  Trophy, 
  Star, 
  BookCheck, 
  Flame, 
  ChevronRight, 
  LogOut,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, Profile, updateUserStreak } from "@/services/profileService";
import { getModules, isModuleCompleted } from "@/services/moduleService";
import { getUserRanking } from "@/services/rankingService";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";
import BottomNavigation from "@/components/BottomNavigation";

// --- INTERFACES ---
interface StatsCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: string | number;
  label: string;
}

interface ProfileData {
  userProfile: Profile | null;
  completedCount: number;
  userRank: number;
}

// --- COMPONENTES AUXILIARES ---

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, value, label }) => (
  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-white p-4 text-center shadow-sm border border-slate-200/50">
    <Icon className="h-6 w-6 text-orange-500 mb-1" aria-hidden="true" />
    <p className="text-xl font-bold text-slate-800">{value}</p>
    <p className="text-xs font-medium text-slate-500">{label}</p>
  </div>
);

const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-100 animate-pulse">
    <header className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md bg-slate-200" />
          <Skeleton className="h-5 w-32 rounded-md bg-slate-200" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-24 rounded-full bg-slate-200" />
          <Skeleton className="h-16 w-16 rounded-full bg-slate-200" />
        </div>
      </div>
    </header>
    <main className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mt-8 space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-24 flex-1 rounded-2xl bg-slate-200" />
          <Skeleton className="h-24 flex-1 rounded-2xl bg-slate-200" />
          <Skeleton className="h-24 flex-1 rounded-2xl bg-slate-200" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
        <Skeleton className="h-32 w-full rounded-2xl bg-slate-200" />
      </div>
    </main>
  </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
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
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  </div>
);

const ProfileHeader: React.FC<{ profile: Profile }> = ({ profile }) => (
  <header className="p-4 sm:p-6 lg:p-8">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          {profile.full_name || 'Usuário'}
        </h1>
        <p className="text-sm text-slate-500">
          @{profile.username || 'username'}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border">
          <Flame className="h-6 w-6 text-red-500" aria-hidden="true" />
          <span className="text-lg font-bold text-orange-600">
            {profile.streak_days || 0}
          </span>
        </div>
        <Link to="/editar-perfil" aria-label="Editar perfil">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg transition-transform hover:scale-110">
            <AvatarImage 
              src={profile.avatar_url || ''} 
              alt={`Avatar de ${profile.full_name}`}
            />
            <AvatarFallback>
              {profile.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  </header>
);

const AboutSection: React.FC<{ profile: Profile }> = ({ profile }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/50">
    <h3 className="font-bold text-slate-700">Sobre</h3>
    <p className="text-sm text-slate-500 leading-relaxed mt-1">
      {profile.bio || "Nenhuma biografia adicionada."}
    </p>
    {profile.linkedin_url && (
      <a 
        href={profile.linkedin_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold mt-2 hover:text-blue-800 transition-colors"
        aria-label="Abrir perfil no LinkedIn"
      >
        <Linkedin className="h-4 w-4" aria-hidden="true" />
        Perfil no LinkedIn
      </a>
    )}
  </div>
);

const ProfileActions: React.FC<{ onSignOut: () => Promise<void> }> = ({ onSignOut }) => (
  <div className="space-y-3 pt-4">
    <Link 
      to="/editar-perfil" 
      className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:bg-slate-50 group"
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
      className="w-full justify-start gap-3 p-4 h-auto text-base font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" 
      onClick={onSignOut}
      aria-label="Sair da conta"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
      Sair da conta
    </Button>
  </div>
);

// --- Hook personalizado para dados do perfil ---
const useProfileData = () => {
  return useQuery<ProfileData>({
    queryKey: ['profilePageData'],
    queryFn: async (): Promise<ProfileData> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Erro de sessão: ${sessionError.message}`);
      }
      
      if (!session?.user?.id) {
        throw new Error("Usuário não autenticado.");
      }
      
      const userId = session.user.id;
      
      try {
        // Atualizar streak do usuário
        await updateUserStreak(userId);

        // Buscar dados em paralelo
        const [userProfile, modules, ranking] = await Promise.all([
          getProfile(userId),
          getModules(),
          getUserRanking("all")
        ]);

        // Calcular módulos completados
        let completedCount = 0;
        if (modules && userId) {
          const completionPromises = modules.map(module => isModuleCompleted(userId, module.id));
          const completionResults = await Promise.all(completionPromises);
          completedCount = completionResults.filter(Boolean).length;
        }
        
        // Encontrar posição no ranking
        const userPosition = ranking?.findIndex((user) => user.id === userId);
        const userRank = userPosition !== -1 ? (userPosition || 0) + 1 : 0;
        
        return { 
          userProfile, 
          completedCount, 
          userRank 
        };
      } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
        throw new Error("Falha ao carregar dados do perfil");
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
};

// --- COMPONENTE PRINCIPAL ---
export default function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedModulesCount, setCompletedModulesCount] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useProfileData();

  useEffect(() => {
    if (data) {
      setProfile(data.userProfile);
      setCompletedModulesCount(data.completedCount);
      setUserRank(data.userRank);
    }
  }, [data]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (error) {
      console.error("Erro na ProfilePage:", error);
      toast.error("Não foi possível carregar seu perfil.");
    }
  }, [error]);
    
  const handleSignOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Erro ao sair da conta. Tente novamente.");
        return;
      }
      toast.success("Você foi desconectado com sucesso.");
      navigate('/login');
    } catch (err) {
      console.error("Erro no logout:", err);
      toast.error("Erro inesperado ao sair da conta.");
    }
  };

  const handleRetry = (): void => {
    refetch();
  };

  // Estados de loading e erro
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return <ErrorState onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <ProfileHeader profile={profile} />

      <main className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-6">
          {/* Cards de estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <StatsCard 
              icon={Trophy} 
              value={userRank > 0 ? `${userRank}º` : "N/A"} 
              label="Ranking" 
            />
            <StatsCard 
              icon={Star} 
              value={profile.xp || 0} 
              label="XP Total" 
            />
            <StatsCard 
              icon={BookCheck} 
              value={completedModulesCount} 
              label="Módulos" 
            />
          </div>

          {/* Seção Sobre */}
          <AboutSection profile={profile} />

          {/* Gráfico de Performance - usando o mesmo componente do Dashboard */}
          <WeeklyProgressChart streak={profile.streak_days || 0} userId={userId} />

          {/* Ações do Perfil */}
          <ProfileActions onSignOut={handleSignOut} />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
