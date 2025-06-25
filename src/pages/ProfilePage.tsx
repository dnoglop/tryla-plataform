import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

// Imports de Ícones e Componentes
import {
  Trophy, Star, BookCheck, LogOut, Settings, ChevronRight,
  Flame, Award, Lock, Share2, Linkedin, Heart, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";

// Serviços e Tipos
import { getProfile, updateUserStreak, Profile } from "@/services/profileService";
import { getModules, isModuleCompleted } from "@/services/moduleService";
import { getUserRanking, RankingUser } from "@/services/rankingService";

// --- NOVAS INTERFACES E LÓGICA DE NÍVEL ---
const LEVELS = [
    { name: 'Semente', minXp: 0 }, { name: 'Eco', minXp: 100 },
    { name: 'Pulso', minXp: 200 }, { name: 'Chave', minXp: 300 },
    { name: 'Rastro', minXp: 400 }, { name: 'Brilho', minXp: 500 },
    { name: 'Voo', minXp: 600 }, { name: 'Passo', minXp: 700 },
    { name: 'Laço', minXp: 800 }, { name: 'Base', minXp: 900 },
    { name: 'Foco', minXp: 1000 }, { name: 'Ritmo', minXp: 1100 },
    { name: 'Faísca', minXp: 1200 }, { name: 'Forja', minXp: 1300 },
    { name: 'Escudo', minXp: 1400 }, { name: 'Mestre', minXp: 1500 },
    { name: 'Ponte', minXp: 1600 }, { name: 'Visão', minXp: 1700 },
    { name: 'Código', minXp: 1800 }, { name: 'Raiz', minXp: 1900 },
    { name: 'Mapa', minXp: 2000 }, { name: 'Farol', minXp: 2100 },
    { name: 'Missão', minXp: 2200 }, { name: 'Caminho', minXp: 2300 },
    { name: 'Alvo', minXp: 2400 }, { name: 'Despertar', minXp: 2500 },
    { name: 'Impacto', minXp: 2600 }, { name: 'Liderança', minXp: 2700 },
    { name: 'Legado', minXp: 2800 }, { name: 'Transforma', minXp: 2900 },
];

const calculateLevelInfo = (xp: number) => {
    if (typeof xp !== 'number' || xp < 0) xp = 0;
    const currentLevel = [...LEVELS].reverse().find(level => xp >= level.minXp) || LEVELS[0];
    return currentLevel;
};

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'comum' | 'raro' | 'épico' | 'lendário';
}

interface UserBadge {
  badge_id: number;
  unlocked_at: string;
  achievements: Achievement;
}

interface ProfilePageData {
  userProfile: Profile;
  completedModuleCount: number;
  userRank: number;
  userBadges: UserBadge[];
  allAchievements: Achievement[];
}

// --- COMPONENTES REUTILIZÁVEIS ---

// **NOVO COMPONENTE STATS CARD**
const StatsCard = ({ icon: Icon, value, label, isPrimary = false }) => (
    <div className="card-gradient-orange rounded-2xl p-4 flex flex-col justify-center text-center">
        <Icon className={cn("w-6 h-6 mx-auto mb-2", isPrimary ? "text-primary" : "text-foreground")} />
        <span className={cn("text-2xl font-bold", isPrimary ? "text-primary" : "text-foreground")}>{value}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
);


const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pb-24 animate-pulse">
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-48 bg-muted" />
          <Skeleton className="h-6 w-32 bg-muted" />
          <Skeleton className="h-8 w-24 bg-muted" />
        </div>
      </div>
      <Skeleton className="h-24 rounded-2xl bg-muted" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-lg bg-muted" />
        <Skeleton className="h-28 rounded-lg bg-muted" />
        <Skeleton className="h-28 rounded-lg bg-muted" />
      </div>
      <Skeleton className="h-48 rounded-2xl bg-muted" />
    </div>
  </div>
);

const AchievementModal = ({ achievement, unlockedAt, onClose }: { achievement: Achievement; unlockedAt: string | null; onClose: () => void }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'comum': return 'from-gray-400 to-gray-500';
      case 'raro': return 'from-blue-400 to-blue-500';
      case 'épico': return 'from-purple-400 to-purple-500';
      case 'lendário': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center border" initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} onClick={(e) => e.stopPropagation()}>
        <div className={cn('w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-4', unlockedAt ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} shadow-lg` : 'bg-muted')}>
          <span className={!unlockedAt ? 'grayscale opacity-50' : ''}>{achievement.icon}</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{achievement.name}</h3>
        <p className="text-muted-foreground mb-4">{achievement.description}</p>
        <div className="bg-muted/50 rounded-2xl p-4 mb-6">
          <div className="text-center">
            <div className={`text-lg font-bold capitalize ${unlockedAt ? 'text-primary' : 'text-muted-foreground'}`}>{achievement.rarity}</div>
            <div className="text-xs text-muted-foreground">Raridade</div>
          </div>
        </div>
        {unlockedAt && (<div className="text-green-600 dark:text-green-400 font-medium mb-4">✓ Conquistado em {new Date(unlockedAt).toLocaleDateString('pt-BR')}</div>)}
        <Button onClick={onClose} className="w-full btn-saga-primario">Fechar</Button>
      </motion.div>
    </motion.div>
  );
};


// --- HOOK DE DADOS ---
const useProfileData = (userId: string | null) => {
  return useQuery<ProfilePageData, Error>({
    queryKey: ["profilePageData", userId],
    queryFn: async (): Promise<ProfilePageData> => {
      if (!userId) throw new Error("ID do usuário não fornecido.");
      const profileQuery = supabase.from("profiles").select("*").eq("id", userId).single();

      const [profileResult, modulesData, rankingData, badgesData, achievementsData] = await Promise.all([
        profileQuery,
        getModules(),
        getUserRanking("all"),
        supabase.from('user_badges').select('*, achievements(*)').eq('user_id', userId),
        supabase.from('achievements').select('*')
      ]);

      if (profileResult.error) throw profileResult.error;
      const userProfileData = profileResult.data;
      if (!userProfileData) throw new Error("Perfil do usuário não encontrado.");
      if (badgesData.error) throw badgesData.error;
      if (achievementsData.error) throw achievementsData.error;

      const completionResults = await Promise.all(
        (modulesData || []).map((module) => isModuleCompleted(userId, module.id))
      );
      const completedModuleCount = completionResults.filter(Boolean).length;
      const userPosition = (rankingData || []).findIndex((user: RankingUser) => user.id === userId);
      const userRank = userPosition !== -1 ? userPosition + 1 : 0;

      updateUserStreak(userId).catch((err) => console.error("Falha ao atualizar streak:", err));

      return {
        userProfile: userProfileData,
        completedModuleCount, userRank,
        userBadges: (badgesData.data as UserBadge[] | null) || [],
        allAchievements: (achievementsData.data as Achievement[] | null) || [],
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

// --- COMPONENTE PRINCIPAL ---
export default function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<{ achievement: Achievement, unlockedAt: string | null } | null>(null);

  useEffect(() => {
    const getCurrentUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
      else navigate("/login", { replace: true });
    };
    getCurrentUserId();
  }, [navigate]);

  const { data, isLoading, isError } = useProfileData(userId);
  const queryClient = useQueryClient();

  const handleSignOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    queryClient.clear();
    if (error) toast.error("Erro ao sair da conta.");
    else { toast.success("Até logo!"); navigate("/login", { replace: true }); }
  };

  if (isLoading || !data) {
    return <ProfileSkeleton />;
  }

  if (isError) {
    return <div className="flex items-center justify-center h-screen">Erro ao carregar o perfil.</div>;
  }

  const { userProfile, completedModuleCount, userRank, userBadges, allAchievements } = data;
  const levelInfo = userProfile.xp !== null ? calculateLevelInfo(userProfile.xp) : null;
  const isAdmin = userProfile.role === "admin";

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } };

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-950 font-nunito">
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementModal 
            achievement={selectedAchievement.achievement}
            unlockedAt={selectedAchievement.unlockedAt}
            onClose={() => setSelectedAchievement(null)} 
          />
        )}
      </AnimatePresence>

      <main className="pb-20 max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <motion.div variants={itemVariants} className="flex items-center gap-6">
              <motion.img
                src={userProfile.avatar_url || `https://ui-avatars.com/api/?name=${userProfile.full_name?.replace(/\s/g, "+")}&background=random`}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full shadow-lg"
              />
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl font-extrabold text-foreground">{userProfile.full_name}</h1>
                {levelInfo && (
                  <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                    Nível {levelInfo.name}
                  </div>
                )}
                {userProfile.linkedin_url && (
                  <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground -ml-2">
                      <Linkedin className="w-4 h-4" /> <span>LinkedIn</span>
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>

            {userProfile.bio && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                  <Heart className="w-4 h-4 text-primary" />
                  <span>Sobre mim</span>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{userProfile.bio}</p>
              </motion.div>
            )}

            <hr className="border-border/50" />

            {/* **STATS ATUALIZADAS COM OS NOVOS CARDS** */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                <StatsCard icon={Trophy} value={userRank > 0 ? `${userRank}º` : "N/A"} label="RANKING" isPrimary />
                <StatsCard icon={Star} value={userProfile.xp || 0} label="XP TOTAL"/>
                <StatsCard icon={BookCheck} value={completedModuleCount} label="MÓDULOS" />
            </motion.div>

            <motion.div variants={itemVariants} className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 sm:p-6 text-primary-foreground shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2"><Award className="w-5 h-5" /><h3 className="font-semibold">Suas Conquistas</h3></div>
                  <span className="text-xs font-medium opacity-80">{userBadges.length}/{allAchievements.length}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {allAchievements.map((achievement) => {
                    const userBadge = userBadges.find(b => b.badge_id === achievement.id);
                    const isUnlocked = !!userBadge;
                    return (
                      <motion.div key={achievement.id} className="flex flex-col items-center text-center cursor-pointer" whileHover={{ scale: 1.1 }} onClick={() => setSelectedAchievement({ achievement, unlockedAt: userBadge?.unlocked_at || null })}>
                        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all bg-white/20', isUnlocked ? 'shadow-lg' : 'bg-white/10')}>
                          <span className={!isUnlocked ? 'grayscale opacity-50' : ''}>{achievement.icon}</span>
                        </div>
                        <p className="text-xs font-medium mt-2 truncate w-full">{achievement.name}</p>
                      </motion.div>
                    );
                  })}
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-2xl bg-card p-6 shadow-md border">
              <WeeklyProgressChart streak={userProfile.streak_days || 0} userId={userId} />
            </motion.div>

            <div className="pt-4 space-y-3">
              <Link to="/configuracoes" className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border">
                  <div className="flex items-center gap-4"><Settings className="h-5 w-5 text-primary" /><span className="font-semibold text-card-foreground">Configurações</span></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>

              {isAdmin && (
                <Link to="/admin" className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border">
                  <div className="flex items-center gap-4"><Shield className="h-5 w-5 text-primary" /><span className="font-semibold text-card-foreground">Painel de Controle</span></div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </main>
      <BottomNavigation />
    </div>
  );
}