// src/pages/ProfilePage.tsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Imports de ícones e componentes
// ADICIONADO o ícone Settings
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
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getProfile,
  updateUserStreak,
  Profile,
} from "@/services/profileService";
import {
  getModules,
  isModuleCompleted,
  Module as ModuleType,
} from "@/services/moduleService";
import { getUserRanking, RankingUser } from "@/services/rankingService";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";
import BottomNavigation from "@/components/BottomNavigation";
// import { profile } from "console"; // Comentado pois não estava sendo usado e causaria erro.

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

// --- COMPONENTES AUXILIARES ESTILIZADOS (ATUALIZADOS PARA DARK MODE) ---

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, value, label }) => (
  // MUDANÇA: Cores atualizadas para usar variáveis de tema
  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-card p-4 text-center shadow-sm border min-h-[100px]">
    <Icon className="h-6 w-6 text-primary mb-1.5" aria-hidden="true" />
    <p className="text-xl font-bold text-card-foreground">{value}</p>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
  </div>
);

const ProfileSkeleton: React.FC = () => (
  // MUDANÇA: Cores atualizadas para usar variáveis de tema
  <div className="min-h-screen bg-background animate-pulse">
    <header className="p-4 sm:p-6 lg:p-8 bg-card shadow-sm sticky top-0 z-10 border-b">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md bg-muted" />
          <Skeleton className="h-5 w-32 rounded-md bg-muted" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20 rounded-full bg-muted" />
          <Skeleton className="h-16 w-16 rounded-full bg-muted" />
        </div>
      </div>
    </header>
    <main className="px-4 sm:px-6 lg:px-8 pb-24 max-w-4xl mx-auto mt-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-2xl bg-muted" />
        <Skeleton className="h-24 rounded-2xl bg-muted" />
        <Skeleton className="h-24 rounded-2xl bg-muted" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl bg-muted" />
      <Skeleton className="h-60 w-full rounded-2xl bg-muted" />
      <Skeleton className="h-12 w-full rounded-xl bg-muted" />
      <Skeleton className="h-12 w-full rounded-xl bg-muted" />
    </main>
  </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  // MUDANÇA: Cores atualizadas para usar variáveis de tema
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
    <div className="text-center bg-card p-8 rounded-2xl shadow-sm border max-w-md w-full">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-card-foreground mb-2">
        Erro ao carregar perfil
      </h2>
      <p className="text-muted-foreground mb-6">
        Não foi possível carregar suas informações. Tente novamente.
      </p>
      <Button
        onClick={onRetry}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  </div>
);

const ProfileHeader: React.FC<{ profile: Profile }> = ({ profile }) => (
  // MUDANÇA: Cores atualizadas para usar variáveis de tema
  <header className="p-4 sm:p-6 lg:p-8 bg-card shadow-sm sticky top-0 z-10 border-b">
    <div className="flex justify-between items-center max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {profile.full_name || "Seu Perfil"}
        </h1>
        <p className="text-sm text-muted-foreground">
          @{profile.username || "username"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 border">
          <Flame className="h-6 w-6 text-red-500" aria-hidden="true" />
          <span className="text-lg font-bold text-primary">
            {profile.streak_days || 0}
          </span>
        </div>
        <Link to="/editar-perfil" aria-label="Editar perfil">
          <Avatar className="h-16 w-16 border-4 border-background shadow-lg transition-transform hover:scale-110 ring-2 ring-primary">
            <AvatarImage
              src={profile.avatar_url || undefined}
              alt={`Avatar de ${profile.full_name}`}
            />
            <AvatarFallback className="bg-accent text-primary text-2xl font-semibold">
              {profile.full_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  </header>
);

const AboutSection: React.FC<{ profile: Profile }> = ({ profile }) => (
  // MUDANÇA: Cores atualizadas para usar variáveis de tema
  <div className="rounded-2xl bg-card p-6 shadow-sm border">
    <h3 className="text-lg font-bold text-card-foreground mb-2">Sobre Mim</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">
      {profile.bio || "Nenhuma biografia informada ainda."}
    </p>
    {profile.linkedin_url && (
      <a
        href={
          profile.linkedin_url.startsWith("http")
            ? profile.linkedin_url
            : `https://${profile.linkedin_url}`
        }
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold mt-3 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        aria-label="Abrir perfil no LinkedIn"
      >
        <Linkedin className="h-4 w-4" aria-hidden="true" />
        Ver perfil no LinkedIn
      </a>
    )}
  </div>
);

const ProfileActions: React.FC<{ onSignOut: () => Promise<void> }> = ({
  onSignOut,
}) => (
  // MUDANÇA: Cores atualizadas e botão de Configurações adicionado
  <div className="space-y-3 pt-4">
    <Link
      to="/editar-perfil"
      className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border group"
      aria-label="Editar perfil"
    >
      <div className="flex items-center gap-4">
        <Edit className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="font-semibold text-card-foreground">
          Editar Perfil
        </span>
      </div>
      <ChevronRight
        className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
        aria-hidden="true"
      />
    </Link>

    {/* BOTÃO DE CONFIGURAÇÕES ADICIONADO */}
    <Link
      to="/configuracoes"
      className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border group"
      aria-label="Abrir configurações"
    >
      <div className="flex items-center gap-4">
        <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="font-semibold text-card-foreground">
          Configurações
        </span>
      </div>
      <ChevronRight
        className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
        aria-hidden="true"
      />
    </Link>

    <Button
      variant="ghost"
      className="w-full justify-start gap-3 p-4 h-auto text-base font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive/80 transition-colors rounded-xl"
      onClick={onSignOut}
      aria-label="Sair da conta"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
      Sair da conta
    </Button>
  </div>
);

// --- FUNÇÃO HELPER PARA CRIAR O DELAY ---
const createDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// --- HOOK PERSONALIZADO PARA DADOS DO PERFIL (SEM MUDANÇAS NA LÓGICA) ---
const useProfileData = (userId: string | null) => {
  return useQuery<ProfilePageData, Error>({
    queryKey: ["profilePageData", userId],
    queryFn: async (): Promise<ProfilePageData> => {
      if (!userId) {
        throw new Error("ID do usuário não fornecido para a busca de dados.");
      }

      const delayPromise = createDelay(1000);

      const dataFetchPromise = (async () => {
        const [userProfileData, modulesData, rankingData] = await Promise.all([
          getProfile(userId),
          getModules(),
          getUserRanking("all"),
        ]);

        if (!userProfileData) {
          throw new Error("Perfil do usuário não encontrado.");
        }

        let completedCount = 0;
        if (modulesData?.length) {
          const completionResults = await Promise.all(
            modulesData.map((module) => isModuleCompleted(userId, module.id)),
          );
          completedCount = completionResults.filter(Boolean).length;
        }

        const userPosition = rankingData?.findIndex(
          (user: RankingUser) => user.id === userId,
        );
        const userRank =
          userPosition !== undefined && userPosition !== -1
            ? userPosition + 1
            : 0;

        updateUserStreak(userId).catch((err) =>
          console.error("Falha ao atualizar streak em segundo plano:", err),
        );

        return { userProfile: userProfileData, completedCount, userRank };
      })();

      await delayPromise;

      try {
        const result = await dataFetchPromise;
        return result;
      } catch (error) {
        console.error("Erro na busca de dados do perfil (após delay):", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    retry: 0,
  });
};

// --- COMPONENTE PRINCIPAL ---
export default function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUserId = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate("/login", { replace: true });
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
      navigate("/login", { replace: true });
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
    // MUDANÇA: Cor de fundo principal agora usa variável de tema
    <div className="min-h-screen bg-background">
      <ProfileHeader profile={userProfile} />

      <main className="px-4 sm:px-6 lg:px-8 pb-24 max-w-4xl mx-auto mt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              icon={Trophy}
              value={userRank > 0 ? `${userRank}º` : "N/D"}
              label="Ranking Geral"
            />
            <StatsCard
              icon={Star}
              value={userProfile.xp || 0}
              label="XP Total"
            />
            <StatsCard
              icon={BookCheck}
              value={completedCount}
              label="Módulos Concluídos"
            />
          </div>

          <AboutSection profile={userProfile} />

          {userId && (
            <WeeklyProgressChart
              streak={userProfile.streak_days || 0}
              userId={userId}
            />
          )}

          <ProfileActions onSignOut={handleSignOut} />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
