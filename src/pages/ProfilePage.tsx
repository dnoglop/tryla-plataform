import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Imports de ícones e componentes
// ADICIONADO o ícone Shield para o botão de admin
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
  Shield, // <-- NOVO ÍCONE
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

// --- INTERFACES LOCAIS ---
interface StatsCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: string | number;
  label: string;
}

// ATUALIZADO: Interface de dados da página para incluir o perfil completo
interface ProfilePageData {
  userProfile: Profile;
  completedCount: number;
  userRank: number;
}

// ATUALIZADO: Props do ProfileActions para incluir a flag de admin
interface ProfileActionsProps {
  onSignOut: () => Promise<void>;
  isAdmin: boolean; // <-- NOVA PROP
}


// --- COMPONENTES AUXILIARES (sem mudanças, apenas para contexto) ---

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, value, label }) => (
  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-card p-4 text-center shadow-sm border min-h-[100px]">
    <Icon className="h-6 w-6 text-primary mb-1.5" aria-hidden="true" />
    <p className="text-xl font-bold text-card-foreground">{value}</p>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
  </div>
);

const ProfileSkeleton: React.FC = () => (
    <div className="min-h-screen bg-background animate-pulse">
        {/* ... código do skeleton ... */}
    </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* ... código do estado de erro ... */}
    </div>
);

const ProfileHeader: React.FC<{ profile: Profile }> = ({ profile }) => (
    <header className="p-4 sm:p-6 lg:p-8 bg-card shadow-sm sticky top-0 z-10 border-b">
        {/* ... código do header do perfil ... */}
    </header>
);

const AboutSection: React.FC<{ profile: Profile }> = ({ profile }) => (
    <div className="rounded-2xl bg-card p-6 shadow-sm border">
        {/* ... código da seção "Sobre mim" ... */}
    </div>
);


// --- COMPONENTE ATUALIZADO: ProfileActions ---
const ProfileActions: React.FC<ProfileActionsProps> = ({
  onSignOut,
  isAdmin, // <-- RECEBE A NOVA PROP
}) => (
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

    {/* BOTÃO DE ADMIN ADICIONADO COM RENDERIZAÇÃO CONDICIONAL */}
    {isAdmin && (
      <Link
        to="/admin"
        className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border group"
        aria-label="Acessar painel de administração"
      >
        <div className="flex items-center gap-4">
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-semibold text-card-foreground">
            Painel Admin
          </span>
        </div>
        <ChevronRight
          className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
          aria-hidden="true"
        />
      </Link>
    )}

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

// --- HOOK PERSONALIZADO PARA DADOS DO PERFIL (sem mudanças na lógica interna) ---
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

  // ATUALIZADO: Verifica se o usuário é admin
  const isAdmin = userProfile.role === 'admin';

  return (
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

          {/* ATUALIZADO: Passa a prop isAdmin para ProfileActions */}
          <ProfileActions onSignOut={handleSignOut} isAdmin={isAdmin} />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}