// src/pages/DashboardPage.tsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/sessionStore";

// Ícones e Componentes
import { ArrowRight, Sparkles, X, Gift, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";
import {
    getModules,
    Module,
    getUserNextPhase,
    isModuleCompleted,
} from "@/services/moduleService";
import {
    getProfile,
    Profile,
    updateUserStreak,
} from "@/services/profileService";
import ForumThread from "@/components/ForumThread";

// --- COMPONENTES VISUAIS AUXILIARES ---
const DashboardSkeleton = () => (
    // MUDANÇA: Cores de fundo e do skeleton adaptadas para o tema
    <div className="bg-background min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <header className="flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-muted" />
                <Skeleton className="h-8 w-48 bg-muted" />
            </div>
            <Skeleton className="h-14 w-14 rounded-full bg-muted" />
        </header>
        <main className="pt-4 space-y-6">
            <Skeleton className="h-24 rounded-2xl bg-muted" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-48 rounded-2xl bg-muted" />
                <Skeleton className="h-48 rounded-2xl bg-muted" />
            </div>
            <Skeleton className="h-40 rounded-2xl bg-muted" />
        </main>
    </div>
);

const WelcomeModal = ({
    open,
    onOpenChange,
    username,
    quote,
    isLoadingQuote,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    username: string;
    quote: string;
    isLoadingQuote: boolean;
}) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
            {/* MUDANÇA: Cores do modal adaptadas para o tema */}
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-card p-8 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out">
                <div className="text-center">
                    <Sparkles className="mx-auto h-10 w-10 text-primary mb-4" />
                    <Dialog.Title className="text-2xl font-bold text-card-foreground">
                        Olá, {username}!
                    </Dialog.Title>
                    <Dialog.Description className="text-muted-foreground mt-2 text-base min-h-[48px] flex items-center justify-center">
                        {isLoadingQuote ? (
                            <span className="italic">
                                Buscando inspiração...
                            </span>
                        ) : (
                            `"${quote}"`
                        )}
                    </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                    <button className="mt-8 w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-orange-500/30 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                        Começar o dia!
                    </button>
                </Dialog.Close>
                <Dialog.Close asChild>
                    <button
                        aria-label="Fechar"
                        className="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-muted/50"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
);

const fetchDailyQuote = async () => {
    try {
        const { data, error } =
            await supabase.functions.invoke("get-daily-quote");
        if (error) throw error;
        return (
            data.quote || "Cada passo que você dá hoje constrói o seu amanhã."
        );
    } catch (error) {
        console.error("Erro ao buscar citação diária:", error);
        return "A jornada mais importante é a que você faz para dentro de si mesmo.";
    }
};

// --- COMPONENTE PRINCIPAL ---
export default function DashboardPage() {
    // ... (lógica do componente permanece a mesma)
    const queryClient = useQueryClient();
    const { hasShownWelcomeModal, setHasShownWelcomeModal } = useSessionStore();
    const [userId, setUserId] = useState<string | null>(null);
    const [nextPhase, setNextPhase] = useState<any>(null);
    const [nextModule, setNextModule] = useState<Module | null>(null);
    const [completedModulesCount, setCompletedModulesCount] = useState(0);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [dailyXpClaimed, setDailyXpClaimed] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        fetchUser();
    }, []);

    const { data: profile, isLoading: isLoadingPage } = useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            if (!userId) return null;
            return getProfile(userId);
        },
        enabled: !!userId,
    });

    useEffect(() => {
        if (!userId) return;
        const handleDailyTasks = async () => {
            const wasStreakUpdated = await updateUserStreak(userId);
            if (wasStreakUpdated) {
                console.log(
                    "Streak foi atualizado. Invalidando cache do perfil...",
                );
                queryClient.invalidateQueries({
                    queryKey: ["profile", userId],
                });
            }
            const todayStr = new Date().toISOString().split("T")[0];
            const { count } = await supabase
                .from("xp_history")
                .select("id", { count: "exact" })
                .eq("user_id", userId)
                .eq("source", "DAILY_BONUS")
                .gte("created_at", `${todayStr}T00:00:00.000Z`);
            if (count && count > 0) setDailyXpClaimed(true);
            const lastModalShowDate = localStorage.getItem(
                "lastWelcomeModalShow",
            );
            if (!hasShownWelcomeModal && lastModalShowDate !== todayStr) {
                setShowWelcomeModal(true);
                localStorage.setItem("lastWelcomeModalShow", todayStr);
                setHasShownWelcomeModal(true);
            }
        };
        handleDailyTasks();
    }, [userId, queryClient, hasShownWelcomeModal, setHasShownWelcomeModal]);

    const { data: modules = [] } = useQuery({
        queryKey: ["modules"],
        queryFn: getModules,
    });

    useEffect(() => {
        if (!userId || !modules || modules.length === 0) return;
        const fetchProgress = async () => {
            let completedCount = 0;
            let nextPhaseFound = false;
            for (const module of modules) {
                const isCompleted = await isModuleCompleted(userId, module.id);
                if (isCompleted) {
                    completedCount++;
                } else if (!nextPhaseFound) {
                    const nextPhaseData = await getUserNextPhase(
                        userId,
                        module.id,
                    );
                    if (nextPhaseData) {
                        setNextPhase(nextPhaseData);
                        setNextModule(module);
                        nextPhaseFound = true;
                    }
                }
            }
            setCompletedModulesCount(completedCount);
        };
        fetchProgress();
    }, [userId, modules]);

    const { data: dailyQuote, isLoading: isLoadingQuote } = useQuery({
        queryKey: ["dailyQuote", new Date().toISOString().split("T")[0]],
        queryFn: fetchDailyQuote,
        enabled: showWelcomeModal,
    });

    const handleClaimDailyXp = async () => {
        if (!userId || isClaiming || dailyXpClaimed) return;
        setIsClaiming(true);
        try {
            const xpAmount = 50;
            const { error } = await supabase
                .from("xp_history")
                .insert({
                    user_id: userId,
                    xp_amount: xpAmount,
                    source: "DAILY_BONUS",
                });
            if (error) throw error;
            setDailyXpClaimed(true);
            queryClient.invalidateQueries({ queryKey: ["profile", userId] });
            toast.custom(
                (t) => (
                    <div className="flex items-center gap-3 bg-card border shadow-lg rounded-xl p-4 w-full max-w-sm">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-card-foreground">
                                Bônus Diário!
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Você ganhou +{xpAmount} XP por sua dedicação!
                            </p>
                        </div>
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="opacity-50 hover:opacity-100"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ),
                { duration: 3000 },
            );
        } catch (error: any) {
            console.error("Erro ao reclamar XP diário:", error.message);
            toast.error("Ops! Não foi possível reclamar seu bônus.");
        } finally {
            setIsClaiming(false);
        }
    };

    const communityPosts = [
        {
            id: 1,
            title: "Dicas para a primeira entrevista",
            author: "Mariana",
            preview: "Compartilho algumas dicas valiosas que me ajudaram...",
            authorAvatar: "https://i.pravatar.cc/150?img=5",
            replies: 5,
            likes: 12,
            timeAgo: "2h",
            tags: [],
        },
        {
            id: 2,
            title: "O que acharam do módulo de Growth Mindset?",
            author: "Lucas",
            preview: "Gostaria de saber a opinião de vocês sobre este módulo...",
            authorAvatar: "https://i.pravatar.cc/150?img=3",
            replies: 8,
            likes: 21,
            timeAgo: "4h",
            tags: [],
        },
    ];

    if (isLoadingPage || !profile) {
        return <DashboardSkeleton />;
    }

    return (
        <>
            <WelcomeModal
                open={showWelcomeModal}
                onOpenChange={setShowWelcomeModal}
                username={profile?.full_name?.split(" ")[0] || "Jovem"}
                quote={dailyQuote || "Sua jornada de sucesso começa agora."}
                isLoadingQuote={isLoadingQuote}
            />
            {/* MUDANÇA: Cores de fundo e texto adaptadas para o tema */}
            <div className="bg-background min-h-screen">
                <header className="p-4 sm:p-6 lg:p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-muted-foreground">
                                Bem-vindo(a) de volta,
                            </p>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                {profile?.full_name?.split(" ")[0]}!
                            </h1>
                        </div>
                        <Link to="/perfil">
                            <img
                                src={
                                    profile.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${profile.full_name?.replace(/\s/g, "+")}&background=random`
                                }
                                alt="Perfil"
                                className="h-14 w-14 rounded-full border-2 border-background shadow-md transition-transform hover:scale-110"
                            />
                        </Link>
                    </div>
                </header>

                <main className="p-4 sm:p-6 pt-0 space-y-6">
                    <div
                        className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${dailyXpClaimed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-primary/10 border-primary/20"}`}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`p-3 rounded-full ${dailyXpClaimed ? "bg-emerald-500/20" : "bg-primary/20"}`}
                                >
                                    {dailyXpClaimed ? (
                                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                                    ) : (
                                        <Gift className="h-6 w-6 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground">
                                        Bônus Diário
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {dailyXpClaimed
                                            ? "Você já pegou sua recompensa hoje. Volte amanhã!"
                                            : "Reclame 50 XP por sua dedicação!"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClaimDailyXp}
                                disabled={dailyXpClaimed || isClaiming}
                                className={cn(
                                    "w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-white shadow-md transition-all duration-200",
                                    dailyXpClaimed
                                        ? "bg-slate-300 dark:bg-slate-600 cursor-not-allowed"
                                        : "bg-primary hover:bg-primary/90 hover:-translate-y-1 active:translate-y-0",
                                )}
                            >
                                {dailyXpClaimed
                                    ? "Coletado"
                                    : isClaiming
                                      ? "Coletando..."
                                      : "Coletar 50 XP"}
                            </button>
                        </div>
                    </div>
                    <h2 className="font-bold text-lg text-foreground">
                        Sua Atividade Recente
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            {userId && (
                                <WeeklyProgressChart
                                    streak={profile.streak_days || 0}
                                    userId={userId}
                                />
                            )}
                        </div>
                        <div className="p-6 bg-card rounded-2xl shadow-sm border flex flex-col justify-around text-center">
                            <div>
                                <p className="text-4xl font-bold text-primary">
                                    {profile.xp || 0}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">
                                    XP Total
                                </p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold text-primary">
                                    {completedModulesCount}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Módulos Concluídos
                                </p>
                            </div>
                        </div>
                    </div>
                    <h2 className="font-bold text-lg text-foreground">
                        Continue sua Jornada
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {nextModule && nextPhase ? (
                            <Link
                                to={`/modulo/${nextModule.id}`}
                                className="group relative p-6 bg-primary/10 dark:bg-primary/20 rounded-2xl shadow-sm border border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-primary/90">
                                            Continuar Trilha
                                        </h3>
                                        <div className="p-3 bg-primary rounded-lg">
                                            <ArrowRight className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                    </div>
                                    <p className="font-semibold text-primary/80 mt-2">
                                        {nextModule.name}
                                    </p>
                                    <p className="text-sm text-primary/70">
                                        {nextPhase.name}
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <div className="p-6 bg-green-500/10 rounded-2xl text-center flex flex-col justify-center items-center">
                                <Sparkles className="h-10 w-10 text-green-600 mb-2" />
                                <h3 className="font-bold text-green-800 dark:text-green-300">
                                    Parabéns!
                                </h3>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    Você concluiu todas as trilhas!
                                </p>
                            </div>
                        )}
                        <Link
                            to="/modulos"
                            className="group p-6 bg-card rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-center items-center text-center"
                        >
                            <div className="p-3 bg-muted rounded-lg mb-3">
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                            <h3 className="font-bold text-card-foreground">
                                Ver todos os Módulos
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Explore novas trilhas de aprendizado.
                            </p>
                        </Link>
                    </div>
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg text-foreground">
                            Últimas na Comunidade
                        </h2>
                        <Link
                            to="/social"
                            className="text-sm font-medium text-primary flex items-center gap-1"
                        >
                            Ver tudo <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {communityPosts.map((post) => (
                            <ForumThread key={post.id} {...post} />
                        ))}
                    </div>
                </main>
                <div className="h-24"></div>
            </div>
        </>
    );
}
