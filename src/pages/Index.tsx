import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { useDailyQuote } from "@/hooks/useDailyQuote";
import { FeatureTourModal } from "@/components/FeatureTourModal";

// Ícones e Componentes
import {
    ArrowRight, Sparkles, X, Gift, CheckCircle, Target, Flame, Play,
    Users, Trophy, Award, BookCheck, BarChart3, Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getModuleById, getUserNextPhase, isModuleCompleted } from "@/services/moduleService";
import { updateUserStreak } from "@/services/profileService";

// --- HELPERS E SUB-COMPONENTES ---

// 1. Definição dos Níveis Temáticos
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

    // Encontra o nível atual buscando de trás para frente
    const currentLevel = [...LEVELS].reverse().find(level => xp >= level.minXp) || LEVELS[0];
    const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name);

    // Encontra o próximo nível
    const nextLevel = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;

    if (!nextLevel) { // Usuário atingiu o nível máximo
        return {
            currentLevel,
            nextLevel: null,
            progressPercent: 100,
            xpFaltante: 0,
            currentXp: xp,
            nextLevelXp: xp,
        };
    }

    const xpForThisLevel = nextLevel.minXp - currentLevel.minXp;
    const progressInLevel = xp - currentLevel.minXp;
    const progressPercent = (progressInLevel / xpForThisLevel) * 100;
    const xpFaltante = nextLevel.minXp - xp;

    return {
        currentLevel,
        nextLevel,
        progressPercent,
        xpFaltante,
        currentXp: xp,
        nextLevelXp: nextLevel.minXp,
    };
};


const DashboardSkeleton = () => (
    <div className="bg-background min-h-screen">
        <div className="animate-pulse">
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-2"><Skeleton className="h-5 w-32 bg-muted" /><Skeleton className="h-8 w-48 bg-muted" /></div>
                    <Skeleton className="h-14 w-14 rounded-full bg-muted" />
                </div>
            </header>
            <main className="p-4 sm:p-6 pt-0 space-y-8">
                <div className="grid grid-cols-3 gap-6"><Skeleton className="h-24 rounded-2xl bg-muted" /><Skeleton className="h-24 rounded-2xl bg-muted" /><Skeleton className="h-24 rounded-2xl bg-muted" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="lg:col-span-1 h-60 rounded-2xl bg-muted" /><Skeleton className="lg:col-span-2 h-60 rounded-2xl bg-muted" /></div>
                <Skeleton className="h-40 rounded-2xl bg-muted" />
            </main>
        </div>
    </div>
);

const ComeBackTomorrowModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-card p-8 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out border">
                <div className="text-center">
                    <CheckCircle className="mx-auto h-10 w-10 text-primary mb-4" />
                    <Dialog.Title className="text-2xl font-bold text-card-foreground">Recompensa Coletada!</Dialog.Title>
                    <Dialog.Description className="text-muted-foreground mt-2 text-base">Você ganhou +50 XP pela sua dedicação. Volte amanhã para mais!</Dialog.Description>
                </div>
                <Dialog.Close asChild><button className="mt-8 w-full btn-saga-primario py-3 text-base">Entendido!</button></Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
);

const WelcomeModal = ({ open, onOpenChange, username, quote, isLoadingQuote, }: { open: boolean; onOpenChange: (open: boolean) => void; username: string; quote: string | undefined; isLoadingQuote: boolean; }) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-card p-8 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out border">
                <div className="text-center">
                    <Sparkles className="mx-auto h-10 w-10 text-primary mb-4" /><Dialog.Title className="text-2xl font-bold text-card-foreground">Olá, {username}!</Dialog.Title>
                    <Dialog.Description className="text-muted-foreground mt-2 text-base min-h-[48px] flex items-center justify-center">{isLoadingQuote ? (<span className="italic">Carregando a inspiração de hoje...</span>) : (`"${quote || "Sua jornada de sucesso começa agora."}"`)}</Dialog.Description>
                </div>
                <Dialog.Close asChild><button className="mt-8 w-full btn-saga-primario py-3 text-base">Começar o dia!</button></Dialog.Close>
                <Dialog.Close asChild><button aria-label="Fechar" className="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-accent"><X className="h-5 w-5 text-muted-foreground" /></button></Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
);

const CalendarWidget = ({ streak }: { streak: number }) => {
    const today = new Date(); const currentMonth = today.getMonth(); const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const monthName = today.toLocaleString('pt-BR', { month: 'long' });
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1; const date = new Date(currentYear, currentMonth, day); const isToday = day === today.getDate();
        const streakEndDate = new Date(today); const streakStartDate = new Date(today); streakStartDate.setDate(today.getDate() - streak + 1);
        const isActive = date >= streakStartDate && date <= streakEndDate;
        return { day, isToday, isActive };
    });
    const emptySlots = Array.from({ length: firstDayOfMonth });
    return (
        <div className="card-trilha rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground font-nunito capitalize">{monthName} {currentYear}</h3>
                <div className="flex items-center space-x-1 text-primary"><span className="text-sm font-medium font-nunito">{streak} dias de foco!</span><Flame className="w-4 h-4" /></div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (<div key={i} className="text-xs text-muted-foreground font-nunito py-1">{day}</div>))}
                {emptySlots.map((_, i) => <div key={`empty-${i}`}></div>)}
                {calendarDays.map(({ day, isToday, isActive }) => (
                    <motion.div key={day} className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium font-nunito relative", { 'bg-primary text-primary-foreground shadow-md': isToday, 'bg-primary/10 text-primary': isActive && !isToday, 'text-muted-foreground hover:bg-muted': !isActive && !isToday, })}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: day * 0.02, type: 'spring', stiffness: 200, damping: 20 }}>
                        {day}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const StyledDailyChallengeCard = ({ challenge, timeRemaining, onComplete, canComplete, isLoading }) => {
    if (isLoading) return <Skeleton className="h-64 rounded-2xl bg-muted" />;
    if (!challenge) return <div className="card-trilha p-6 text-center text-muted-foreground">Nenhum desafio hoje. Aproveite para explorar!</div>;

    return (
        <motion.div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white relative overflow-hidden" whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><Award className="w-5 h-5 text-white" /></div>
                        <span className="text-lg font-bold opacity-90 font-nunito">Topa esse desafio?</span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs opacity-75 font-nunito">Próximo em:</div>
                        <div className="text-sm font-bold font-nunito">{timeRemaining}</div>
                    </div>
                </div>
                <p className="text-1lg font-medium mb-4 font-nunito min-h-[48px]">{challenge.challenge_text}</p>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-1 text-sm font-semibold"><Sparkles className="w-4 h-4" /><span>+15 XP</span></div>
                    <motion.button onClick={onComplete} disabled={!canComplete} className={cn("bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 font-nunito shadow-lg", !canComplete && "opacity-50 cursor-not-allowed")}
                        whileHover={{ scale: canComplete ? 1.05 : 1 }} whileTap={{ scale: canComplete ? 0.95 : 1 }}>
                        <Trophy className="w-4 h-4" /><span>{canComplete ? "Aceitar Desafio" : "Concluído"}</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};


// --- COMPONENTE PRINCIPAL ---
const Index = () => {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [showFeatureTour, setShowFeatureTour] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [dailyXpClaimed, setDailyXpClaimed] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [showComeBackModal, setShowComeBackModal] = useState(false);

    const tourSteps = [ /* Seus passos do tour aqui... */ ];

    useEffect(() => { const fetchUser = async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) setUserId(user.id); }; fetchUser(); }, []);

    const { data: pageData, isLoading: isLoadingPage } = useQuery({
        queryKey: ["dashboardData", userId],
        queryFn: async () => {
            if (!userId) return null;
            const [profileResult, onboardingResult, completedPhasesResult] = await Promise.all([
                supabase.from("profiles").select("*, has_seen_product_tour, xp, streak_days").eq("id", userId).single(),
                supabase.from("user_onboarding").select("user_id").eq("user_id", userId).maybeSingle(),
                supabase.from("user_phases").select("id", { count: "exact" }).eq("user_id", userId).eq("status", "completed"),
            ]);
            if (profileResult.error) throw profileResult.error;
            const profile = profileResult.data;
            const onboardingCompleted = !!onboardingResult.data;
            const profileWithOnboarding = { ...profile, onboarding_completed: onboardingCompleted, completedPhasesCount: completedPhasesResult.count || 0 };
            let trackData = { nextModule: null, nextPhase: null, completedModuleCount: 0 };
            if (onboardingCompleted) {
                const { data: userTrack } = await supabase.from("user_tracks").select("module_ids").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
                if (userTrack?.module_ids?.length > 0) {
                    let completedModuleCount = 0, nextModuleData = null, nextPhaseData = null, nextPhaseFound = false;
                    for (const moduleId of userTrack.module_ids) {
                        const isCompleted = await isModuleCompleted(userId, moduleId);
                        if (isCompleted) { completedModuleCount++; }
                        else if (!nextPhaseFound) {
                            const [moduleDetails, phaseDetails] = await Promise.all([getModuleById(moduleId), getUserNextPhase(userId, moduleId)]);
                            if (moduleDetails && phaseDetails) { nextModuleData = moduleDetails; nextPhaseData = phaseDetails; nextPhaseFound = true; }
                        }
                    }
                    trackData = { nextModule: nextModuleData, nextPhase: nextPhaseData, completedModuleCount: completedModuleCount };
                }
            }
            return { profile: profileWithOnboarding, trackData };
        },
        enabled: !!userId,
    });

    const profile = pageData?.profile;
    const trackData = pageData?.trackData;
    const levelInfo = profile?.xp !== null && profile?.xp !== undefined ? calculateLevelInfo(profile.xp) : null;

    useEffect(() => { if (profile && profile.onboarding_completed && !profile.has_seen_product_tour) { setTimeout(() => setShowFeatureTour(true), 500); } }, [profile]);

    useEffect(() => {
        if (!userId) return;
        const handleDailyTasks = async () => {
            const wasStreakUpdated = await updateUserStreak(userId);
            if (wasStreakUpdated) queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
            const todayStr = new Date().toISOString().split("T")[0];
            const { count } = await supabase.from("xp_history").select("id", { count: "exact" }).eq("user_id", userId).eq("source", "DAILY_BONUS").gte("created_at", `${todayStr}T00:00:00.000Z`);
            if (count && count > 0) setDailyXpClaimed(true);
        };
        handleDailyTasks();
        const todayStr = new Date().toISOString().split("T")[0];
        const storageKey = `lastWelcomeModalShow_${userId}`;
        const lastModalShowDate = localStorage.getItem(storageKey);
        if (lastModalShowDate !== todayStr) { setShowWelcomeModal(true); localStorage.setItem(storageKey, todayStr); }
    }, [userId, queryClient]);

    const { data: dailyQuote, isLoading: isLoadingQuote } = useDailyQuote();
    const dailyChallenge = useDailyChallenge(userId || "");

    const handleClaimDailyXp = async () => {
        if (!userId || isClaiming || dailyXpClaimed) return;
        setIsClaiming(true);
        try {
            await supabase.from("xp_history").insert({ user_id: userId, xp_amount: 50, source: "DAILY_BONUS" });
            setDailyXpClaimed(true);
            setShowComeBackModal(true);
            queryClient.invalidateQueries({ queryKey: ["dashboardData", userId] });
        } catch (error) { console.error("Erro ao pegar o XP diário:", error); }
        finally { setIsClaiming(false); }
    };

    if (isLoadingPage || !profile) { return <Layout><DashboardSkeleton /></Layout>; }

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } };
    const getMotivationalMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia! Que tal começar o dia com energia?";
        if (hour < 18) return "Boa tarde! Vamos continuar a jornada?";
        return "Boa noite! Finalize o dia com chave de ouro!";
    };

    return (
        <Layout>
            <div className="min-h-screen animated-gradient-bg font-nunito">
                <FeatureTourModal isOpen={showFeatureTour} onClose={() => {}} steps={tourSteps} />
                <WelcomeModal open={showWelcomeModal} onOpenChange={setShowWelcomeModal} username={profile?.full_name?.split(" ")[0] || "Jovem"} quote={dailyQuote} isLoadingQuote={isLoadingQuote} />
                <ComeBackTomorrowModal open={showComeBackModal} onOpenChange={setShowComeBackModal} />

                <motion.div className="max-w-4xl mx-auto" initial="hidden" animate="visible" variants={containerVariants}>
                    <motion.header variants={itemVariants} className="p-4 sm:p-6 lg:p-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Olá, <span className="text-primary">{profile?.full_name?.split(" ")[0]}!</span></h1>
                                <p className="text-muted-foreground mt-1">{getMotivationalMessage()}</p>
                            </div>
                            <Link to="/perfil"><motion.img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name?.replace(/\s/g, "+")}&background=random`} alt="Perfil" className="h-14 w-14 rounded-full border-2 border-transparent shadow-md" whileHover={{ scale: 1.1, borderColor: 'hsl(var(--primary))' }} transition={{ type: 'spring', stiffness: 300 }} /></Link>
                        </div>
                    </motion.header>

                    <main className="p-4 sm:p-6 pt-0 space-y-6">
                        <AnimatePresence>
                            {!dailyXpClaimed && (
                                <motion.div variants={itemVariants} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                    <div className="rounded-2xl p-5 shadow-sm border bg-primary/10 border-primary/20 mb-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-4"><div className="p-3 rounded-full bg-primary/20"><Gift className="h-6 w-6 text-primary" /></div><div><h2 className="font-bold text-card-foreground">Recompensa diária</h2><p className="text-sm text-muted-foreground">Sua dedicação merece um bônus!</p></div></div>
                                            <motion.button onClick={handleClaimDailyXp} disabled={isClaiming} className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-primary-foreground shadow-md btn-saga-primario" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{isClaiming ? "Coletando..." : "Pegar +50 XP"}</motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-3 gap-4">
                            <motion.div variants={itemVariants} className="card-gradient-orange rounded-2xl p-4 flex flex-col justify-center text-center">
                                <Zap className="w-5 h-5 text-primary mx-auto mb-1" /><span className="text-2xl font-bold text-primary">{profile.xp || 0}</span><span className="text-xs text-muted-foreground font-medium">XP Total</span>
                            </motion.div>
                            <motion.div variants={itemVariants} className="card-gradient-orange rounded-2xl p-4 flex flex-col justify-center text-center">
                                <BookCheck className="w-5 h-5 text-foreground mx-auto mb-1" /><span className="text-2xl font-bold text-foreground">{profile.completedPhasesCount || 0}</span><span className="text-xs text-muted-foreground font-medium">Lições Concluídas</span>
                            </motion.div>
                            <motion.div variants={itemVariants} className="card-gradient-orange rounded-2xl p-4 flex flex-col justify-center text-center">
                                <Target className="w-5 h-5 text-foreground mx-auto mb-1" /><span className="text-2xl font-bold text-foreground">{trackData?.completedModuleCount || 0}</span><span className="text-xs text-muted-foreground font-medium">Módulos</span>
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants}>
                            {trackData?.nextModule && trackData?.nextPhase ? (
                                <Link to={`/modulo/${trackData.nextModule.id}/fase/${trackData.nextPhase.id}`} className="block h-full">
                                    <motion.div className="group bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground relative overflow-hidden h-full flex flex-col sm:flex-row sm:items-center justify-between" whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}>
                                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-background/10 rounded-full"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center space-x-2 mb-3"><Target className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Sua próxima missão</span></div>
                                            <h3 className="text-lg font-bold mb-1">{trackData.nextModule.name}</h3>
                                            <p className="text-primary-foreground/80 text-sm">Capítulo: {trackData.nextPhase.name}</p>
                                        </div>
                                        <motion.div className="bg-background text-primary px-6 py-3 mt-4 sm:mt-0 rounded-full font-semibold flex items-center justify-center space-x-2 shadow-lg self-start sm:self-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Play className="w-4 h-4" /><span>Começar</span><ArrowRight className="w-4 h-4" /></motion.div>
                                    </motion.div>
                                </Link>
                            ) : (
                                <div className="p-6 bg-emerald-500/10 border-emerald-500/20 border rounded-2xl text-center flex flex-col justify-center items-center h-full"><Sparkles className="h-10 w-10 text-emerald-600 mb-2" /><h3 className="font-bold text-emerald-700 dark:text-emerald-400">Parabéns, {profile?.full_name?.split(" ")[0]}!</h3><p className="text-sm text-emerald-600 dark:text-emerald-300">Você concluiu sua trilha personalizada!</p></div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div variants={itemVariants} className="md:col-span-1"><CalendarWidget streak={profile.streak_days || 0} /></motion.div>
                            <motion.div variants={itemVariants} className="md:col-span-2">
                                <div className="bg-card rounded-2xl p-6 border h-full flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-foreground">Suba para o próximo nível</h3>
                                        {levelInfo?.currentLevel && <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Nível {levelInfo.currentLevel.name}</span>}
                                    </div>
                                    <p className="text-muted-foreground text-sm">Continue assim para alcançar o próximo nível e desbloquear novas recompensas!</p>
                                    {levelInfo && (
                                        <>
                                            {levelInfo.nextLevel && levelInfo.xpFaltante > 0 && 
                                                <p className="text-sm font-semibold text-primary mt-2 mb-3">
                                                    Meta de hoje: consiga mais {levelInfo.xpFaltante} XP para o nível {levelInfo.nextLevel.name}!
                                                </p>
                                            }
                                            {/* O container da barra */}
                                            <div className="w-full bg-muted rounded-full h-2.5 my-1">
                                                {/* A barra de progresso em si, com a classe correta */}
                                                <motion.div 
                                                    className="essencia-valor h-2.5 rounded-full" 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${levelInfo.progressPercent}%` }} 
                                                    transition={{ duration: 1, ease: "easeOut" }} 
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>{levelInfo.currentXp} XP</span><span>{levelInfo.nextLevel ? levelInfo.nextLevel.minXp : levelInfo.currentXp} XP</span></div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants}>
                            <div className="flex justify-between items-center mb-3 mt-8">
                                <h2 className="cabecalho-secao pl-0 border-l-0 text-lg sm:text-xl"><BarChart3 className="h-5 w-5 text-primary" />Desafio do Dia</h2>
                            </div>
                            <StyledDailyChallengeCard challenge={dailyChallenge.currentChallenge} timeRemaining={dailyChallenge.timeRemaining} onComplete={dailyChallenge.completeChallenge} canComplete={dailyChallenge.canComplete} isLoading={dailyChallenge.isLoading} />
                        </motion.div>
                    </main>
                </motion.div>
            </div>
        </Layout>
    );
};

export default Index;