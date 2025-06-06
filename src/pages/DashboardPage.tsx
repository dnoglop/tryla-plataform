
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Ícones e Componentes
import { ArrowRight, Flame, Sparkles, X, Gift, CheckCircle } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyProgressChart } from "@/components/WeeklyProgressChart";
import { getModules, Module, getUserNextPhase, isModuleCompleted } from "@/services/moduleService";
import { getProfile, Profile, updateUserStreak, updateUserXp } from "@/services/profileService";
import ForumThread from "@/components/ForumThread";

// --- INÍCIO: COMPONENTES VISUAIS AUXILIARES (sem alterações) ---

const DashboardSkeleton = () => (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
        <header className="flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-slate-200" />
                <Skeleton className="h-8 w-48 bg-slate-200" />
            </div>
            <Skeleton className="h-14 w-14 rounded-full bg-slate-200" />
        </header>
        <main className="pt-4 space-y-6">
            <Skeleton className="h-24 rounded-2xl bg-slate-200" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-48 rounded-2xl bg-slate-200" />
                <Skeleton className="h-48 rounded-2xl bg-slate-200" />
            </div>
            <Skeleton className="h-40 rounded-2xl bg-slate-200" />
        </main>
    </div>
);

const WelcomeModal = ({ open, onOpenChange, username, quote }: { open: boolean, onOpenChange: (open: boolean) => void, username: string, quote: string }) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white/80 backdrop-blur-2xl border p-8 rounded-3xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out">
                <div className="text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-orange-500" />
                    <Dialog.Title className="text-2xl font-bold text-slate-800 mt-4">Olá, {username}!</Dialog.Title>
                    <Dialog.Description className="text-slate-600 mt-2 italic">"{quote}"</Dialog.Description>
                </div>
                <Dialog.Close asChild>
                    <button className="mt-6 w-full px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm shadow-lg transition-all hover:bg-orange-600 hover:-translate-y-1 active:translate-y-0 active:scale-95">Começar o dia!</button>
                </Dialog.Close>
                <Dialog.Close asChild>
                    <button className="absolute top-4 right-4 rounded-full p-1.5 transition-colors hover:bg-black/10"><X className="h-5 w-5 text-slate-500" /></button>
                </Dialog.Close>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
);

// --- FIM: COMPONENTES VISUAIS AUXILIARES ---

export default function DashboardPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [nextPhase, setNextPhase] = useState<any>(null);
    const [nextModule, setNextModule] = useState<Module | null>(null);
    const [completedModulesCount, setCompletedModulesCount] = useState(0);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [motivationalQuote] = useState("A única maneira de fazer um ótimo trabalho é amar o que você faz.");
    const [dailyXpClaimed, setDailyXpClaimed] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                await updateUserStreak(user.id);
                const userProfile = await getProfile(user.id);
                if (userProfile) {
                    setProfile(userProfile);
                    const today = new Date().toISOString().split('T')[0];
                    const lastVisit = localStorage.getItem('lastVisit');
                    if (lastVisit !== today) { setShowWelcomeModal(true); localStorage.setItem('lastVisit', today); }
                    const { data: claimData, error: claimError } = await supabase.from('daily_xp_claims').select('id').eq('user_id', user.id).eq('claimed_at', today).single();
                    if (claimError && claimError.code !== 'PGRST116') { console.error("Erro ao verificar XP diário:", claimError); }
                    if (claimData) { setDailyXpClaimed(true); }
                }
            }
        };
        fetchInitialData();
    }, []);

    const { data: modules = [], isLoading: isLoadingModules } = useQuery({
        queryKey: ['modules'],
        queryFn: getModules,
        enabled: !!userId,
    });

    useEffect(() => {
        if (!userId || modules.length === 0) return;
        const fetchProgress = async () => {
            let completedCount = 0;
            let nextPhaseFound = false;
            for (const module of modules) {
                if (await isModuleCompleted(userId, module.id)) {
                    completedCount++;
                } else if (!nextPhaseFound) {
                    const nextPhaseData = await getUserNextPhase(userId, module.id);
                    if (nextPhaseData) { setNextPhase(nextPhaseData); setNextModule(module); nextPhaseFound = true; }
                }
            }
            setCompletedModulesCount(completedCount);
        };
        fetchProgress();
    }, [userId, modules]);

    const handleClaimDailyXp = async () => {
        if (!userId || dailyXpClaimed || isClaiming) return;
        setIsClaiming(true);

        try {
            const today = new Date().toISOString().split('T')[0];
            const xpAmount = 50;
            
            await supabase.from('daily_xp_claims').insert({ user_id: userId, claimed_at: today, xp_amount: xpAmount });
            
            const { newXp, newLevel } = await updateUserXp(userId, xpAmount);

            setProfile(prev => prev ? { ...prev, xp: newXp, level: newLevel } : null);
            setDailyXpClaimed(true);

            toast.custom((t) => (
                <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-xl p-4 w-full max-w-sm">
                    <div className="bg-orange-100 p-2 rounded-full"><Gift className="h-6 w-6 text-orange-500" /></div>
                    <div className="flex-grow">
                        <p className="font-bold text-slate-800">Bônus Diário!</p>
                        <p className="text-sm text-slate-600">Você ganhou +{xpAmount} XP por sua dedicação!</p>
                    </div>
                    <button onClick={() => toast.dismiss(t)} className="opacity-50 hover:opacity-100"><X size={18} /></button>
                </div>
            ), { duration: 5000 });

        } catch (error) {
            console.error("Erro ao reclamar XP diário:", error);
            toast.error("Ops! Não foi possível reclamar seu bônus. Tente mais tarde.");
        } finally {
            setIsClaiming(false);
        }
    };
    
    const communityPosts = [
        { id: 1, title: "Dicas para a primeira entrevista", author: "Mariana", authorAvatar: "https://i.pravatar.cc/150?img=5", replies: 5, likes: 12, tags: [] },
        { id: 2, title: "O que acharam do módulo de Growth Mindset?", author: "Lucas", authorAvatar: "https://i.pravatar.cc/150?img=3", replies: 8, likes: 21, tags: [] },
    ];
    
    if (isLoadingModules || !profile) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <WelcomeModal open={showWelcomeModal} onOpenChange={setShowWelcomeModal} username={profile?.full_name?.split(' ')[0] || "Jovem"} quote={motivationalQuote} />
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-500">Bem-vindo(a) de volta,</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{profile?.full_name?.split(' ')[0]}!</h1>
                    </div>
                    <Link to="/perfil">
                        <img src={profile.avatar_url} alt="Perfil" className="h-14 w-14 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110" />
                    </Link>
                </div>
            </header>
            
            <main className="p-4 sm:p-6 pt-0 space-y-6">
                <div className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${dailyXpClaimed ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${dailyXpClaimed ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                                {dailyXpClaimed ? <CheckCircle className="h-6 w-6 text-emerald-500" /> : <Gift className="h-6 w-6 text-orange-500" />}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Bônus Diário</h2>
                                <p className="text-sm text-slate-600">
                                    {dailyXpClaimed ? "Você já pegou sua recompensa hoje. Volte amanhã!" : "Reclame 50 XP por sua dedicação!"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClaimDailyXp}
                            disabled={dailyXpClaimed || isClaiming}
                            className={cn( "w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-white shadow-md transition-all duration-200", dailyXpClaimed ? "bg-slate-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 hover:-translate-y-1 active:translate-y-0")}
                        >
                            {dailyXpClaimed ? "Coletado" : isClaiming ? "Coletando..." : "Coletar 50 XP"}
                        </button>
                    </div>
                </div>
                <h2 className="font-bold text-lg text-slate-800">Sua Atividade Recente</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <WeeklyProgressChart streak={profile.streak_days || 0} userId={userId} />
                    </div>
                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50 flex flex-col justify-around text-center">
                        <div><p className="text-4xl font-bold text-orange-500">{profile.xp || 0}</p><p className="text-sm text-slate-500 font-medium">XP Total</p></div>
                        <div><p className="text-4xl font-bold text-orange-500">{completedModulesCount}</p><p className="text-sm text-slate-500 font-medium">Módulos Concluídos</p></div>
                    </div>
                </div>
                <h2 className="font-bold text-lg text-slate-800">Continue sua Jornada</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nextModule && nextPhase ? (
                        <Link to={`/modulo/${nextModule.id}`} className="group relative p-6 bg-orange-50 rounded-2xl shadow-sm border border-orange-200/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-orange-900">Continuar Trilha</h3>
                                    <div className="p-3 bg-orange-500 rounded-lg"><ArrowRight className="h-5 w-5 text-white" /></div>
                                </div>
                                <p className="font-semibold text-orange-800 mt-2">{nextModule.name}</p>
                                <p className="text-sm text-orange-700/80">{nextPhase.name}</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="p-6 bg-green-50 rounded-2xl text-center flex flex-col justify-center items-center">
                            <Sparkles className="h-10 w-10 text-green-600 mb-2" />
                            <h3 className="font-bold text-green-800">Parabéns!</h3>
                            <p className="text-sm text-green-700">Você concluiu todas as trilhas!</p>
                        </div>
                    )}
                    <Link to="/modulos" className="group p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1.5 flex flex-col justify-center items-center text-center">
                        <div className="p-3 bg-slate-100 rounded-lg mb-3"><ArrowRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1" /></div>
                        <h3 className="font-bold text-slate-800">Ver todos os Módulos</h3>
                        <p className="text-sm text-slate-500">Explore novas trilhas de aprendizado.</p>
                    </Link>
                </div>
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800">Últimas na Comunidade</h2>
                    <Link to="/social" className="text-sm font-medium text-orange-600 flex items-center gap-1">Ver tudo <ArrowRight size={14} /></Link>
                </div>
                <div className="space-y-3">
                    {communityPosts.map(post => (<ForumThread key={post.id} {...post} />))}
                </div>
            </main>
            <div className="h-24"></div>
            <BottomNavigation />
        </div>
    );
}
