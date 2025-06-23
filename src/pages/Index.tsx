import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import DailyChallengeCard from "@/components/DailyChallengeCard";
import { useDailyQuote } from "@/hooks/useDailyQuote";
import { FeatureTourModal } from "@/components/FeatureTourModal";

// Ícones e Componentes
import { ArrowRight, Sparkles, X, Gift, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";
import {
    getModuleById,
    Module,
    getUserNextPhase,
    isModuleCompleted,
} from "@/services/moduleService";
import { getProfile, updateUserStreak } from "@/services/profileService";
import ForumThread from "@/components/ForumThread";

// --- SUB-COMPONENTES VISUAIS (Skeletons, Modals) ---

const DashboardSkeleton = () => (
    <div className="bg-background min-h-screen">
        <div className="animate-pulse">
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32 bg-muted" />
                        <Skeleton className="h-8 w-48 bg-muted" />
                    </div>
                    <Skeleton className="h-14 w-14 rounded-full bg-muted" />
                </div>
            </header>
            <main className="p-4 sm:p-6 pt-0 space-y-6">
                <Skeleton className="h-24 rounded-2xl bg-muted" />
                <div className="flex items-center">
                    <Skeleton className="h-6 w-40 bg-muted" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-60 rounded-2xl bg-muted" />
                    <Skeleton className="h-60 rounded-2xl bg-muted" />
                </div>
                <div className="flex items-center">
                    <Skeleton className="h-6 w-32 bg-muted" />
                </div>
                <Skeleton className="h-40 rounded-2xl bg-muted" />
                <div className="flex items-center">
                    <Skeleton className="h-6 w-48 bg-muted" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-32 rounded-2xl bg-muted" />
                    <Skeleton className="h-32 rounded-2xl bg-muted" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-52 bg-muted" />
                    <Skeleton className="h-5 w-20 bg-muted" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-24 rounded-xl bg-muted" />
                    <Skeleton className="h-24 rounded-xl bg-muted" />
                </div>
            </main>
        </div>
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
    quote: string | undefined;
    isLoadingQuote: boolean;
}) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-card p-8 rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out border">
                <div className="text-center">
                    <Sparkles className="mx-auto h-10 w-10 text-primary mb-4" />
                    <Dialog.Title className="text-2xl font-bold text-card-foreground">
                        Olá, {username}!
                    </Dialog.Title>
                    <Dialog.Description className="text-muted-foreground mt-2 text-base min-h-[48px] flex items-center justify-center">
                        {isLoadingQuote ? (
                            <span className="italic">
                                Carregando a inspiração de hoje...
                            </span>
                        ) : (
                            `"${quote || "Sua jornada de sucesso começa agora."}"`
                        )}
                    </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                    <button className="mt-8 w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                        Começar o dia!
                    </button>
                </Dialog.Close>
                <Dialog.Close asChild>
                    <button
                        aria-label="Fechar"
                        className="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-accent"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
);

// --- COMPONENTE PRINCIPAL ---
const Index = () => {
    const queryClient = useQueryClient();

    // States Locais
    const [userId, setUserId] = useState<string | null>(null);
    const [showFeatureTour, setShowFeatureTour] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [dailyXpClaimed, setDailyXpClaimed] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    // Dados para o Tour (com URLs de placeholder, substitua pelas suas)
    const tourSteps = [
        {
            image: "https://i.imgur.com/3mRsSsM.jpeg",
            title: "Desafios diários",
            description:
                "Todos os dias, uma nova atividade rápida aparece aqui para você praticar o que aprendeu e ganhar XP extra!",
        },
        {
            image: "https://i.imgur.com/MkH4yNc.jpeg",
            title: "Acompanhe seu Progresso",
            description:
                "No gráfico, você pode ver seu avanço diario e semanal, junto com o seu XP total.",
        },
        {
            image: "https://i.imgur.com/68jv9r2.jpeg",
            title: "Oráculo Vocacional",
            description:
                "Ainda em dúvida sobre sua carreira? Use nosso Oráculo para explorar profissões que combinam com seu perfil.",
        },
        {
            image: "https://i.imgur.com/BQ3LIl5.jpeg",
            title: "Personalize o Layout",
            description:
                "Prefere um tema mais escuro? Vá até as configurações para ativar o Dark Mode e deixar o app com a sua cara.",
        },
    ];

    // Efeito para pegar o ID do usuário ao montar o componente
    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }
        };
        fetchUser();
    }, []);

    // Query unificada que busca todos os dados necessários para o dashboard
    const { data: pageData, isLoading: isLoadingPage } = useQuery({
        queryKey: ["dashboardData", userId],
        queryFn: async () => {
            if (!userId) return null;

            const [profileResult, onboardingResult] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("*, has_seen_product_tour")
                    .eq("id", userId)
                    .single(),
                supabase
                    .from("user_onboarding")
                    .select("user_id")
                    .eq("user_id", userId)
                    .maybeSingle(),
            ]);

            if (profileResult.error) throw profileResult.error;

            const profile = profileResult.data;
            const onboardingCompleted = !!onboardingResult.data;
            const profileWithOnboarding = {
                ...profile,
                onboarding_completed: onboardingCompleted,
            };

            let trackData = {
                nextModule: null,
                nextPhase: null,
                completedCount: 0,
            };
            if (onboardingCompleted) {
                const { data: userTrack } = await supabase
                    .from("user_tracks")
                    .select("module_ids")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (userTrack?.module_ids?.length > 0) {
                    let completedCount = 0,
                        nextModuleData = null,
                        nextPhaseData = null,
                        nextPhaseFound = false;
                    for (const moduleId of userTrack.module_ids) {
                        const isCompleted = await isModuleCompleted(
                            userId,
                            moduleId,
                        );
                        if (isCompleted) {
                            completedCount++;
                        } else if (!nextPhaseFound) {
                            const [moduleDetails, phaseDetails] =
                                await Promise.all([
                                    getModuleById(moduleId),
                                    getUserNextPhase(userId, moduleId),
                                ]);
                            if (moduleDetails && phaseDetails) {
                                nextModuleData = moduleDetails;
                                nextPhaseData = phaseDetails;
                                nextPhaseFound = true;
                            }
                        }
                    }
                    trackData = {
                        nextModule: nextModuleData,
                        nextPhase: nextPhaseData,
                        completedCount: completedCount,
                    };
                }
            }
            return { profile: profileWithOnboarding, trackData };
        },
        enabled: !!userId,
    });

    const profile = pageData?.profile;
    const trackData = pageData?.trackData;

    // Efeito para disparar o tour
    useEffect(() => {
        if (
            profile &&
            profile.onboarding_completed &&
            !profile.has_seen_product_tour
        ) {
            setTimeout(() => {
                setShowFeatureTour(true);
            }, 500);
        }
    }, [profile]);

    // Efeito para tarefas diárias (bônus e modal de boas-vindas)
    useEffect(() => {
        if (!userId) return;
        const handleDailyTasks = async () => {
            const wasStreakUpdated = await updateUserStreak(userId);
            if (wasStreakUpdated) {
                queryClient.invalidateQueries({
                    queryKey: ["dashboardData", userId],
                });
            }
            const todayStr = new Date().toISOString().split("T")[0];
            const { count } = await supabase
                .from("xp_history")
                .select("id", { count: "exact" })
                .eq("user_id", userId)
                .eq("source", "DAILY_BONUS")
                .gte("created_at", `${todayStr}T00:00:00.000Z`);
            if (count && count > 0) {
                setDailyXpClaimed(true);
            }
        };
        handleDailyTasks();
        const todayStr = new Date().toISOString().split("T")[0];
        const storageKey = `lastWelcomeModalShow_${userId}`;
        const lastModalShowDate = localStorage.getItem(storageKey);
        if (lastModalShowDate !== todayStr) {
            setShowWelcomeModal(true);
            localStorage.setItem(storageKey, todayStr);
        }
    }, [userId, queryClient]);

    // Hooks de cotação e desafio diário
    const { data: dailyQuote, isLoading: isLoadingQuote } = useDailyQuote();
    const dailyChallenge = useDailyChallenge(userId || "");

    // Função para fechar o tour
    const handleTourClose = async () => {
        setShowFeatureTour(false);
        if (userId) {
            try {
                await supabase
                    .from("profiles")
                    .update({ has_seen_product_tour: true })
                    .eq("id", userId);
                queryClient.invalidateQueries({
                    queryKey: ["dashboardData", userId],
                });
            } catch (error) {
                console.error("Falha ao marcar o tour como visto:", error);
            }
        }
    };

    // Função para coletar bônus diário de XP
    const handleClaimDailyXp = async () => {
        if (!userId || isClaiming || dailyXpClaimed) return;
        setIsClaiming(true);
        try {
            const xpAmount = 50;
            const { error } = await supabase.from("xp_history").insert({
                user_id: userId,
                xp_amount: xpAmount,
                source: "DAILY_BONUS",
            });
            if (error) throw error;
            setDailyXpClaimed(true);
            queryClient.invalidateQueries({
                queryKey: ["dashboardData", userId],
            });
            toast.custom(
                (t) => (
                    <div className="flex items-center gap-3 bg-card border border-border shadow-lg rounded-xl p-4 w-full max-w-sm">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-card-foreground">
                                Bônus diário!
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
            console.error("Erro ao pegar o XP diário:", error.message);
            toast.error("Ops! Não foi possível pegar seu bônus diário.");
        } finally {
            setIsClaiming(false);
        }
    };

    // Dados mocados para a comunidade
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
            preview:
                "Gostaria de saber a opinião de vocês sobre este módulo...",
            authorAvatar: "https://i.pravatar.cc/150?img=3",
            replies: 8,
            likes: 21,
            timeAgo: "4h",
            tags: [],
        },
    ];

    // Renderização do estado de carregamento
    if (isLoadingPage || !profile) {
        return (
            <Layout>
                <DashboardSkeleton />
            </Layout>
        );
    }

    // Renderização principal do componente
    return (
        <Layout>
            <FeatureTourModal
                isOpen={showFeatureTour}
                onClose={handleTourClose}
                steps={tourSteps}
            />
            <WelcomeModal
                open={showWelcomeModal}
                onOpenChange={setShowWelcomeModal}
                username={profile?.full_name?.split(" ")[0] || "Jovem"}
                quote={dailyQuote}
                isLoadingQuote={isLoadingQuote}
            />
            <div className="bg-background min-h-screen">
                <header className="p-4 sm:p-6 lg:p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-muted-foreground">
                                De volta à ação,
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
                                    <h2 className="font-bold text-card-foreground">
                                        Recompensa diária
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {dailyXpClaimed
                                            ? "Você já pegou sua recompensa hoje. Volte amanhã!"
                                            : "A sua recompensa por manter o foco está aqui, clique!"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClaimDailyXp}
                                disabled={dailyXpClaimed || isClaiming}
                                className={cn(
                                    "w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-primary-foreground shadow-md transition-all duration-200",
                                    dailyXpClaimed
                                        ? "bg-muted cursor-not-allowed"
                                        : "bg-primary hover:bg-primary/90 hover:-translate-y-1 active:translate-y-0",
                                )}
                            >
                                {dailyXpClaimed
                                    ? "Coletado"
                                    : isClaiming
                                      ? "Coletando..."
                                      : "Pegar meu bônus!"}
                            </button>
                        </div>
                    </div>
                    <h2 className="font-bold text-lg text-foreground">
                        Sua jornada até aqui
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
                                    {trackData?.completedCount || 0}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Módulos Concluídos
                                </p>
                            </div>
                        </div>
                    </div>

                    <h2 className="font-bold text-lg text-foreground">
                        Sua próxima missão
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {trackData?.nextModule && trackData?.nextPhase ? (
                            <Link
                                to={`/modulo/${trackData.nextModule.id}`}
                                className="group relative p-5 bg-primary/10 rounded-2xl shadow-sm border border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-primary mt-2">
                                            {trackData.nextModule.name}
                                        </h4>
                                        <div className="p-3 bg-primary rounded-lg">
                                            <ArrowRight className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground">
                                        Capítulo: {trackData.nextPhase.name}
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <div className="p-6 bg-emerald-500/10 border-emerald-500/20 border rounded-2xl text-center flex flex-col justify-center items-center">
                                <Sparkles className="h-10 w-10 text-emerald-600 mb-2" />
                                <h3 className="font-bold text-emerald-700 dark:text-emerald-400">
                                    Parabéns, {profile?.full_name?.split(" ")[0]}!
                                </h3>
                                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                                    Você concluiu sua trilha personalizada!
                                </p>
                            </div>
                        )}
                        <Link
                            to="/modulos"
                            className="group p-6 bg-card rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-center items-center text-center"
                        >
                            <div className="p-3 bg-accent rounded-lg mb-3">
                                <ArrowRight className="h-5 w-5 text-accent-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                            <h3 className="font-bold text-card-foreground">
                                Ver o mapa da jornada
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Visualize todas as missões da sua saga.
                            </p>
                        </Link>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg text-foreground">
                            Desafio rápido
                        </h2>
                    </div>
                    <DailyChallengeCard
                        challenge={dailyChallenge.currentChallenge}
                        timeRemaining={dailyChallenge.timeRemaining}
                        onComplete={dailyChallenge.completeChallenge}
                        canComplete={dailyChallenge.canComplete}
                        isLoading={dailyChallenge.isLoading}
                    />
                    
                    
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
        </Layout>
    );
};

export default Index;
