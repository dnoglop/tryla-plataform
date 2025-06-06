import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Ícones e Componentes
import { Trophy, Users, Filter, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNavigation from "@/components/BottomNavigation";
import ForumThread from "@/components/ForumThread"; // Assumindo a existência deste componente
import { getUserRanking, RankingUser, RankingPeriod } from "@/services/rankingService";
import { getProfile, Profile } from "@/services/profileService";

// --- COMPONENTES AUXILIARES PARA A SOCIALPAGE ---

// Skeleton da Página Social
const SocialPageSkeleton: React.FC = () => (
    <div className="min-h-screen bg-slate-100 animate-pulse">
        <header className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-md bg-slate-200" />
                    <Skeleton className="h-5 w-64 rounded-md bg-slate-200" />
                </div>
                <Skeleton className="h-14 w-14 rounded-full bg-slate-200" />
            </div>
        </header>
        <main className="px-4 sm:px-6 lg:px-8 pb-24">
            <Skeleton className="h-10 w-full max-w-sm rounded-lg bg-slate-200" />
            <div className="mt-8">
                <div className="flex justify-between items-end h-40">
                    <Skeleton className="h-24 w-1/3 rounded-t-lg bg-slate-200" />
                    <Skeleton className="h-32 w-1/3 rounded-t-lg bg-slate-200" />
                    <Skeleton className="h-20 w-1/3 rounded-t-lg bg-slate-200" />
                </div>
                <div className="mt-8 space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg bg-slate-200" />
                    <Skeleton className="h-16 w-full rounded-lg bg-slate-200" />
                    <Skeleton className="h-16 w-full rounded-lg bg-slate-200" />
                </div>
            </div>
        </main>
    </div>
);

// Componente para o Pódio do Ranking
const Podium: React.FC<{ top3: RankingUser[] }> = ({ top3 }) => {
    const podiumPositions = [
        { user: top3[1], rank: 2, height: 'h-24', avatarSize: 'h-16 w-16', color: 'bg-slate-300' },
        { user: top3[0], rank: 1, height: 'h-32', avatarSize: 'h-20 w-20', color: 'bg-amber-400' },
        { user: top3[2], rank: 3, height: 'h-20', avatarSize: 'h-14 w-14', color: 'bg-amber-600' }
    ];

    return (
        <div className="flex justify-around items-end gap-2">
            {podiumPositions.map(({ user, rank, height, avatarSize, color }) => (
                <div key={rank} className="flex flex-col items-center w-1/3 text-center">
                    <Avatar className={`${avatarSize} border-4 border-white shadow-lg`}>
                        <AvatarImage src={user?.avatar_url || ''} alt={`Avatar de ${user?.username}`} />
                        <AvatarFallback>{user?.username?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-slate-700 text-sm mt-2 truncate w-full">{user?.username || '...'}</p>
                    <p className="text-xs text-slate-500">{user?.xp || 0} XP</p>
                    <div className={`${height} w-full rounded-t-2xl ${color} mt-2 flex items-center justify-center`}>
                        <span className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{rank}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function SocialPage(): JSX.Element {
    const [activeTab, setActiveTab] = useState("comunidade");
    const [profile, setProfile] = useState<Profile | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>("weekly");

    // Hook para buscar o perfil do usuário logado
    const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['socialPageProfile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            return getProfile(user.id);
        }
    });

    // Hook para buscar os dados do ranking
    const { data: rankingData = [], isLoading: isLoadingRanking } = useQuery({
        queryKey: ['ranking', selectedPeriod],
        queryFn: () => getUserRanking(selectedPeriod),
    });

    useEffect(() => {
        if (userProfile) setProfile(userProfile);
    }, [userProfile]);
    
    // Dados mockados para o Fórum (substituir por API no futuro)
    const communityPosts = [
        { id: 1, title: "Dicas para a primeira entrevista", author: "Mariana", authorAvatar: "https://i.pravatar.cc/150?img=5", replies: 5, likes: 12, tags: [] },
        { id: 2, title: "O que acharam do módulo de Growth Mindset?", author: "Lucas", authorAvatar: "https://i.pravatar.cc/150?img=3", replies: 8, likes: 21, tags: [] },
    ];
    
    if (isLoadingProfile || isLoadingRanking || !profile) {
        return <SocialPageSkeleton />;
    }

    const top3 = rankingData.slice(0, 3);
    const others = rankingData.slice(3);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Cabeçalho no estilo da Tela de Perfil/Início */}
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Espaço Social</h1>
                        <p className="text-sm text-slate-500">Conecte-se, compita e cresça.</p>
                    </div>
                    <Link to="/perfil">
                        <Avatar className="h-14 w-14 border-4 border-white shadow-lg transition-transform hover:scale-110">
                            <AvatarImage src={profile.avatar_url || ''} alt={`Avatar de ${profile.full_name}`} />
                            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </header>

            <main className="px-4 sm:px-6 lg:px-8 pb-24">
                <Tabs defaultValue="ranking" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-200/80 p-1 rounded-xl">
                        <TabsTrigger value="comunidade" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Comunidade</TabsTrigger>
                        <TabsTrigger value="ranking" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Ranking</TabsTrigger>
                    </TabsList>
                    
                    {/* ABA COMUNIDADE */}
                    <TabsContent value="comunidade" className="mt-6 space-y-4">
                         <div className="flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">Últimas Discussões</h2>
                            <button className="flex items-center gap-1 rounded-full bg-white p-2 border shadow-sm"><Filter className="h-4 w-4 text-slate-500" /></button>
                        </div>
                        <div className="space-y-3">
                            {communityPosts.map(post => (<ForumThread key={post.id} {...post} />))}
                        </div>
                    </TabsContent>

                    {/* ABA RANKING */}
                    <TabsContent value="ranking" className="mt-6 space-y-6">
                        <div className="flex justify-center gap-2">
                            {(['weekly', 'monthly', 'all'] as RankingPeriod[]).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={cn(
                                        'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                                        selectedPeriod === period ? 'bg-orange-500 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-200'
                                    )}
                                >
                                    {period === 'weekly' ? 'Semanal' : period === 'monthly' ? 'Mensal' : 'Geral'}
                                </button>
                            ))}
                        </div>
                        
                        {/* Pódio 3D */}
                        <Podium top3={top3} />

                        {/* Lista dos outros usuários */}
                        <div className="space-y-2 pt-4">
                            {others.map((user) => (
                                <div key={user.id} className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-slate-200/50">
                                    <p className="w-8 text-center text-slate-500 font-bold">{user.rank}</p>
                                    <Avatar className="h-10 w-10 mr-3">
                                        <AvatarImage src={user.avatar_url || ''} alt={`Avatar de ${user.username}`} />
                                        <AvatarFallback>{user.username?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <p className="flex-1 font-semibold text-slate-700 truncate">{user.username}</p>
                                    <p className="font-bold text-orange-500">{user.xp} XP</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Botão Flutuante que só aparece na aba Comunidade */}
            {activeTab === "comunidade" && (
                <button className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                    <Plus className="h-6 w-6" />
                </button>
            )}

            <BottomNavigation />
        </div>
    );
}