// ARQUIVO: src/pages/ProfilePage.tsx (VERSÃO REATORADA)

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Imports de Ícones e Componentes
import {
  Edit,
  Trophy,
  Star,
  BookCheck,
  LogOut,
  Settings,
  Shield,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation";

// Novos componentes da página de perfil
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";

// Serviços e Tipos
import {
  getProfile,
  updateUserStreak,
  Profile,
} from "@/services/profileService";
import { getModules, isModuleCompleted } from "@/services/moduleService";
import { getUserRanking, RankingUser } from "@/services/rankingService";

// --- INTERFACES ---
interface ProfilePageData {
  userProfile: Profile;
  completedCount: number;
  userRank: number;
}

// --- SKELETON (para uma melhor experiência de carregamento) ---
const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background p-4 pb-24 animate-pulse">
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl bg-card p-6 flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48 bg-muted" />
          <Skeleton className="h-5 w-32 bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-2xl bg-muted" />
        <Skeleton className="h-32 rounded-2xl bg-muted" />
        <Skeleton className="h-32 rounded-2xl bg-muted" />
      </div>
      <Skeleton className="h-48 rounded-2xl bg-muted" />
      <Skeleton className="h-16 rounded-xl bg-muted" />
      <Skeleton className="h-16 rounded-xl bg-muted" />
    </div>
  </div>
);

// --- HOOK DE DADOS (Mantido como está, pois é eficiente) ---
const useProfileData = (userId: string | null) => {
  return useQuery<ProfilePageData, Error>({
    queryKey: ["profilePageData", userId],
    queryFn: async (): Promise<ProfilePageData> => {
      if (!userId) throw new Error("ID do usuário não fornecido.");
      const [userProfileData, modulesData, rankingData] = await Promise.all([
        getProfile(userId),
        getModules(),
        getUserRanking("all"),
      ]);
      if (!userProfileData)
        throw new Error("Perfil do usuário não encontrado.");
      const completionResults = modulesData?.length
        ? await Promise.all(
            modulesData.map((module) => isModuleCompleted(userId, module.id)),
          )
        : [];
      const completedCount = completionResults.filter(Boolean).length;
      const userPosition = rankingData?.findIndex(
        (user: RankingUser) => user.id === userId,
      );
      const userRank =
        userPosition !== undefined && userPosition !== -1
          ? userPosition + 1
          : 0;
      updateUserStreak(userId).catch((err) =>
        console.error("Falha ao atualizar streak:", err),
      );
      return { userProfile: userProfileData, completedCount, userRank };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  value,
  label,
}) => (
  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-card p-4 text-center shadow-sm border border-border/20 min-h-[120px]">
    <Icon className="h-7 w-7 text-primary mb-2" aria-hidden="true" />
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
  </div>
);

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

  const { data, isLoading, isError } = useProfileData(userId);

  const handleSignOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    queryClient.clear();
    if (error) {
      toast.error("Erro ao sair da conta.");
    } else {
      toast.success("Até logo!");
      navigate("/login", { replace: true });
    }
  };

  if (isLoading || !userId) return <ProfileSkeleton />;
  if (isError || !data) return <div>Erro ao carregar o perfil.</div>;

  const { userProfile, completedCount, userRank } = data;
  const isAdmin = userProfile.role === "admin";

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-950">
      <main className="px-4 sm:px-6 py-8 pb-32 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Card de Identidade */}
          <ProfileIdentityCard profile={userProfile} />

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              icon={Trophy}
              value={userRank > 0 ? `${userRank}º` : "N/A"}
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

          {/* Card de Ofensiva Semanal */}
          {userId && (
            <div className="rounded-2xl bg-card p-6 shadow-md border border-border/20">
              <WeeklyProgressChart
                streak={userProfile.streak_days || 0}
                userId={userId}
              />
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-4 space-y-3">
            <Link
              to="/configuracoes"
              className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border border-border/20"
            >
              <div className="flex items-center gap-4">
                <Settings className="h-5 w-5 text-primary" />
                <span className="font-semibold text-card-foreground">
                  Configurações
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border border-border/20"
              >
                <div className="flex items-center gap-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-card-foreground">
                    Painel Admin
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
