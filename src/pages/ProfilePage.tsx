import React, { useState, useEffect, useMemo } from "react";
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
    Crown, BarChart3, Edit3, Bell, Target, Users, Calendar, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/BottomNavigation";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";

// Serviços e Tipos
import { updateUserStreak, Profile } from "@/services/profileService";
import { getModules, isModuleCompleted } from "@/services/moduleService";
import { getUserRanking, RankingUser } from "@/services/rankingService";

// --- LÓGICA DE NÍVEIS ---
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
    const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
    const nextLevel = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;

    if (!nextLevel) {
        return {
            level: currentLevel,
            progressPercent: 100,
            xpToNext: 0,
            isMaxLevel: true,
        };
    }

    const xpForThisLevel = nextLevel.minXp - currentLevel.minXp;
    const progressInLevel = xp - currentLevel.minXp;
    const progressPercent = Math.min((progressInLevel / xpForThisLevel) * 100, 100);
    const xpToNext = nextLevel.minXp - xp;

    return {
        level: currentLevel,
        nextLevel,
        progressPercent,
        xpToNext,
        isMaxLevel: false,
    };
};

// --- INTERFACES ---
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

// --- SKELETON ---
const ProfileSkeleton: React.FC = () => (
    <div className="min-h-screen bg-background dark:bg-neutral-950 p-4 sm:p-6 lg:p-8 pb-24 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-muted h-64 rounded-3xl p-6 flex flex-col justify-end">
                <div className="flex items-end gap-4">
                    <Skeleton className="h-24 w-24 rounded-full bg-muted-foreground/20" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-8 w-48 bg-muted-foreground/20" />
                        <Skeleton className="h-6 w-32 bg-muted-foreground/20" />
                    </div>
                </div>
            </div>
            <Skeleton className="h-12 w-full rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-2xl bg-muted" />
                <Skeleton className="h-28 rounded-2xl bg-muted" />
            </div>
            <Skeleton className="h-48 rounded-2xl bg-muted" />
        </div>
    </div>
);

// --- MODAL DE CONQUISTA ---
const AchievementModal = ({ achievement, unlockedAt, onClose }: { achievement: Achievement; unlockedAt: string | null; onClose: () => void }) => {
    const getRarityStyle = (rarity: string) => {
        switch (rarity) {
            case 'comum': return { gradient: 'from-gray-400 to-gray-500', text: 'text-gray-600', bg: 'bg-gray-100' };
            case 'raro': return { gradient: 'from-blue-400 to-blue-500', text: 'text-blue-600', bg: 'bg-blue-100' };
            case 'épico': return { gradient: 'from-purple-500 to-purple-600', text: 'text-purple-600', bg: 'bg-purple-100' };
            case 'lendário': return { gradient: 'from-yellow-400 to-orange-500', text: 'text-yellow-600', bg: 'bg-yellow-100' };
            default: return { gradient: 'from-gray-400 to-gray-500', text: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };
    const style = getRarityStyle(achievement.rarity);

    return (
        <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="bg-card rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border" initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()}>
                <div className={cn('w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-lg', unlockedAt ? `bg-gradient-to-br ${style.gradient}` : 'bg-muted')}>
                    <span className={!unlockedAt ? 'grayscale opacity-50' : ''}>{achievement.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{achievement.name}</h3>
                <p className="text-muted-foreground mb-6">{achievement.description}</p>
                <div className="bg-muted/50 rounded-2xl p-4 mb-6">
                    <div className="text-center">
                        <div className={`text-xl font-bold capitalize ${unlockedAt ? style.text : 'text-muted-foreground'}`}>{achievement.rarity}</div>
                        <div className="text-xs text-muted-foreground">Raridade</div>
                    </div>
                </div>
                {unlockedAt ? (
                    <div className="text-green-600 dark:text-green-400 font-medium mb-4 text-sm">✓ Conquistado em {new Date(unlockedAt).toLocaleDateString('pt-BR')}</div>
                ) : (
                    <div className="text-amber-600 dark:text-amber-400 font-medium mb-4 text-sm">🔒 Ainda não conquistado</div>
                )}
                <div className="flex gap-3">
                    <Button onClick={onClose} variant="outline" className="w-full py-3 text-base">Fechar</Button>
                    {unlockedAt && <Button className="w-full btn-saga-primario py-3 text-base" onClick={() => toast.info("Funcionalidade de compartilhar em breve!")}><Share2 className="w-4 h-4 mr-2" /> Compartilhar</Button>}
                </div>
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

            await updateUserStreak(userId).catch((err) => console.error("Falha ao atualizar streak:", err));

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

// --- VARIANTES DE ANIMAÇÃO ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

// --- COMPONENTE PRINCIPAL ---
export default function ProfilePage(): JSX.Element {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<{ achievement: Achievement, unlockedAt: string | null } | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

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

    const sortedAchievements = useMemo(() => {
        if (!data) return [];
        const { allAchievements, userBadges } = data;
        const unlockedIds = new Set(userBadges.map(b => b.badge_id));
        return [...allAchievements].sort((a, b) => {
            const aUnlocked = unlockedIds.has(a.id);
            const bUnlocked = unlockedIds.has(b.id);
            if (aUnlocked && !bUnlocked) return -1;
            if (!aUnlocked && bUnlocked) return 1;
            return 0;
        });
    }, [data]);

    if (isLoading || !data) return <ProfileSkeleton />;
    if (isError) return <div className="flex items-center justify-center h-screen text-red-500">Erro ao carregar o perfil. Tente novamente.</div>;

    const { userProfile, completedModuleCount, userRank, userBadges } = data;
    const levelInfo = calculateLevelInfo(userProfile.xp || 0);
    const isAdmin = userProfile.role === "admin";

    const TABS = [
        { id: 'overview', name: 'Visão Geral', icon: BarChart3 },
        { id: 'achievements', name: 'Conquistas', icon: Trophy },
        { id: 'settings', name: 'Configurações', icon: Settings },
    ];

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

            <main className="pb-24 max-w-4xl mx-auto">
                <motion.div initial="hidden" animate="visible" variants={containerVariants}>

                    {/* ==== HEADER ATUALIZADO ==== */}
                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900 m-2 sm:m-4 rounded-3xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-12 -translate-x-12"></div>

                        <div className="relative z-10">
                            <div className="flex items-center space-x-4 mb-5">
                                <div className="relative">
                                    <motion.img
                                        src={userProfile.avatar_url || `https://ui-avatars.com/api/?name=${userProfile.full_name?.replace(/\s/g, "+")}&background=random`}
                                        alt="Foto de perfil"
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
                                        whileHover={{ scale: 1.05 }}
                                    />
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.5 }}
                                        className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-r from-primary to-orange-400 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-neutral-800">
                                        {levelInfo.level.name.substring(0, 1)}
                                    </motion.div>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-xl sm:text-2xl font-bold">{userProfile.full_name}</h1>
                                    <p className="text-white/70 text-sm">Nível: {levelInfo.level.name}</p>
                                    <div className="flex items-center space-x-4 mt-2 text-sm">
                                        <div className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-yellow-400" /><span className="font-semibold">#{userRank > 0 ? userRank : 'N/A'}</span></div>
                                        <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-400" /><span className="font-semibold">{userProfile.streak_days || 0}d</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* ALTERAÇÃO 2: Seção "Sobre mim" movida para cá */}
                            {userProfile.bio && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-white/80">
                                        <Heart className="w-4 h-4 text-primary" />
                                        <span>Sobre mim</span>
                                    </h3>
                                    <p className="text-sm text-white/90 leading-relaxed">{userProfile.bio}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-white/60">
                                    <span>Progresso do Nível</span>
                                    <span>{levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP para o próximo` : 'Nível Máximo!'}</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2">
                                    <motion.div className="h-full essencia-valor rounded-full" initial={{ width: 0 }} animate={{ width: `${levelInfo.progressPercent}%`}} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="px-2 sm:px-4 pt-4">
                        <div className="p-1.5 bg-muted rounded-xl flex items-center gap-1 relative">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative z-10",
                                        activeTab === tab.id
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.name}
                                </button>
                            ))}
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute h-[calc(100%-0.75rem)] bg-primary rounded-lg -z-0"
                                style={{
                                    width: `calc(${100 / TABS.length}% - 0.5rem)`,
                                    left: `calc(${TABS.findIndex(t => t.id === activeTab) * (100 / TABS.length)}% + 0.25rem)`
                                }}
                                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            />
                        </div>
                    </motion.div>

                    <div className="p-4 sm:p-6 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="card-gradient-orange rounded-2xl p-4 flex flex-col justify-center text-center">
                                                <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
                                                <span className="text-3xl font-bold text-primary">{userProfile.xp || 0}</span>
                                                <span className="text-xs text-muted-foreground font-medium">XP TOTAL</span>
                                            </div>
                                            <div className="card-gradient-orange rounded-2xl p-4 flex flex-col justify-center text-center">
                                                <BookCheck className="w-6 h-6 mx-auto mb-2 text-foreground" />
                                                <span className="text-3xl font-bold text-foreground">{completedModuleCount}</span>
                                                <span className="text-xs text-muted-foreground font-medium">MÓDULOS</span>
                                            </div>
                                        </div>

                                        {/* A seção "Sobre Mim" foi removida daqui */}

                                        <div className="rounded-2xl bg-card p-4 sm:p-6 shadow-sm border">
                                            <WeeklyProgressChart streak={userProfile.streak_days || 0} userId={userId} />
                                        </div>
                                        <div className="rounded-2xl bg-card p-4 sm:p-6 shadow-sm border">
                                            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-primary"/>Suas Próximas Metas</h3>
                                            <div className="space-y-3">
                                                <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                                                    <div><p className="font-semibold text-sm text-foreground">Complete 1 novo módulo</p><p className="text-xs text-muted-foreground">+100 XP</p></div>
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground"/>
                                                </div>
                                                <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                                                    <div><p className="font-semibold text-sm text-foreground">Mantenha sua sequência por 7 dias</p><p className="text-xs text-muted-foreground">+250 XP</p></div>
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'achievements' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-bold text-xl text-foreground">Minhas Conquistas</h2>
                                            <span className="font-semibold text-primary">{userBadges.length}/{sortedAchievements.length}</span>
                                        </div>
                                        {sortedAchievements.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {sortedAchievements.map((achievement) => {
                                                    const userBadge = userBadges.find(b => b.badge_id === achievement.id);
                                                    const isUnlocked = !!userBadge;
                                                    return (
                                                        <motion.div
                                                            key={achievement.id}
                                                            className="bg-card border rounded-2xl p-4 text-center cursor-pointer"
                                                            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
                                                            onClick={() => setSelectedAchievement({ achievement, unlockedAt: userBadge?.unlocked_at || null })}
                                                        >
                                                            <div className={cn('w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-all', isUnlocked ? 'bg-primary/10' : 'bg-muted')}>
                                                                <span className={!isUnlocked ? 'grayscale opacity-50' : ''}>{achievement.icon}</span>
                                                            </div>
                                                            <p className="text-sm font-semibold mt-3 text-foreground truncate">{achievement.name}</p>
                                                            <p className={cn("text-xs font-medium capitalize", isUnlocked ? 'text-primary' : 'text-muted-foreground')}>{achievement.rarity || 'Comum'}</p>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 bg-muted rounded-lg"><p className="text-muted-foreground">Nenhuma conquista definida ainda.</p></div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-4">
                                        <h2 className="font-bold text-xl text-foreground">Configurações e Ações</h2>
                                        <Link to="/configuracoes" className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border">
                                            <div className="flex items-center gap-4"><Settings className="h-5 w-5 text-primary" /><span className="font-semibold text-card-foreground">Editar Perfil e Conta</span></div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        {userProfile.linkedin_url && (
                                          <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border">
                                              <div className="flex items-center gap-4"><Linkedin className="h-5 w-5 text-primary" /><span className="font-semibold text-card-foreground">Ver no LinkedIn</span></div>
                                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                          </a>
                                        )}
                                        {isAdmin && (
                                          <Link to="/admin" className="group flex items-center justify-between rounded-xl bg-card p-4 shadow-sm transition-all hover:bg-muted/50 border">
                                            <div className="flex items-center gap-4"><Shield className="h-5 w-5 text-primary" /><span className="font-semibold text-card-foreground">Painel de Controle</span></div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                          </Link>
                                        )}
                                        <div className="pt-8">
                                            <Button onClick={handleSignOut} variant="destructive" className="w-full">
                                                <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>
            <BottomNavigation />
        </div>
    );
}