import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

import { Trophy, Users, Filter, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNavigation from "@/components/BottomNavigation";
import ForumThread from "@/components/ForumThread";
import { getUserRanking, RankingUser, RankingPeriod } from "@/services/rankingService";
import { getProfile, Profile } from "@/services/profileService";

const SocialPageSkeleton: React.FC = () => (
    <div className="min-h-screen bg-background animate-pulse">
        <header className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 rounded-md bg-muted" />
                    <Skeleton className="h-5 w-64 rounded-md bg-muted" />
                </div>
                <Skeleton className="h-14 w-14 rounded-full bg-muted" />
            </div>
        </header>
        <main className="px-4 sm:px-6 lg:px-8 pb-24">
            <Skeleton className="h-10 w-full max-w-sm rounded-lg bg-muted" />
            <div className="mt-8">
                <div className="flex justify-between items-end h-40">
                    <Skeleton className="h-24 w-1/3 rounded-t-lg bg-muted" />
                    <Skeleton className="h-32 w-1/3 rounded-t-lg bg-muted" />
                    <Skeleton className="h-20 w-1/3 rounded-t-lg bg-muted" />
                </div>
                <div className="mt-8 space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg bg-muted" />
                    <Skeleton className="h-16 w-full rounded-lg bg-muted" />
                    <Skeleton className="h-16 w-full rounded-lg bg-muted" />
                </div>
            </div>
        </main>
    </div>
);

const Podium: React.FC<{ top3: RankingUser[] }> = ({ top3 }) => {
    const podiumPositions = [
        { user: top3[1], rank: 2, height: 'h-24', avatarSize: 'h-16 w-16', color: 'bg-muted' },
        { user: top3[0], rank: 1, height: 'h-32', avatarSize: 'h-20 w-20', color: 'bg-primary' },
        { user: top3[2], rank: 3, height: 'h-20', avatarSize: 'h-14 w-14', color: 'bg-secondary' }
    ];

    return (
        <div className="flex justify-around items-end gap-2">
            {podiumPositions.map(({ user, rank, height, avatarSize, color }) => (
                <div key={rank} className="flex flex-col items-center w-1/3 text-center">
                    <Avatar className={`${avatarSize} border-4 border-card shadow-lg`}>
                        <AvatarImage src={user?.avatar_url || ''} alt={`Avatar de ${user?.username}`} />
                        <AvatarFallback>{user?.username?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-foreground text-sm mt-2 truncate w-full">{user?.username || '...'}</p>
                    <p className="text-xs text-muted-foreground">{user?.xp || 0} XP</p>
                    <div className={`${height} w-full rounded-t-2xl ${color} mt-2 flex items-center justify-center`}>
                        <span className="text-3xl font-bold text-primary-foreground" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{rank}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function SocialPage(): JSX.Element {
    const [activeTab, setActiveTab] = useState("comunidade");
    const [profile, setProfile] = useState<Profile | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>("weekly");

    const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['socialPageProfile'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            return getProfile(user.id);
        }
    });

    const { data: rankingData = [], isLoading: isLoadingRanking } = useQuery({
        queryKey: ['ranking', selectedPeriod],
        queryFn: () => getUserRanking(selectedPeriod),
    });

    useEffect(() => {
        if (userProfile) setProfile(userProfile);
    }, [userProfile]);
    
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
            tags: [] 
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
            tags: [] 
        },
    ];
    
    if (isLoadingProfile || isLoadingRanking || !profile) {
        return <SocialPageSkeleton />;
    }

    const top3 = rankingData.slice(0, 3);
    const others = rankingData.slice(3);

    return (
        <div className="min-h-screen bg-background">
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4">

                  <img
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.split(" ")[0] || "A"}&background=random`}
                      alt="Avatar do usuário"
                      className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md transition-transform hover:scale-110"
                    />

                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Espaço Social</h1>
                    <p className="text-sm text-muted-foreground">Conecte-se, compita e cresça.</p>
                  </div>
                </div>
            </header>

            <main className="px-4 sm:px-6 lg:px-8 pb-24">
                <Tabs defaultValue="ranking" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/80 p-1 rounded-xl">
                        <TabsTrigger value="comunidade" className="data-[state=active]:bg-card data-[state=active]:shadow-md">Comunidade</TabsTrigger>
                        <TabsTrigger value="ranking" className="data-[state=active]:bg-card data-[state=active]:shadow-md">Ranking</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="comunidade" className="mt-6 space-y-4">
                         <div className="flex justify-between items-center">
                            <h2 className="font-bold text-lg text-foreground">Últimas Discussões</h2>
                            <button className="flex items-center gap-1 rounded-full bg-card p-2 border shadow-sm"><Filter className="h-4 w-4 text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-3">
                            {communityPosts.map(post => (<ForumThread key={post.id} {...post} />))}
                        </div>
                    </TabsContent>

                    <TabsContent value="ranking" className="mt-6 space-y-6">
                        <div className="flex justify-center gap-2">
                            {(['weekly', 'monthly', 'all'] as RankingPeriod[]).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={cn(
                                        'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                                        selectedPeriod === period ? 'bg-primary text-primary-foreground shadow' : 'bg-card text-foreground hover:bg-muted'
                                    )}
                                >
                                    {period === 'weekly' ? 'Semanal' : period === 'monthly' ? 'Mensal' : 'Geral'}
                                </button>
                            ))}
                        </div>
                        
                        <Podium top3={top3} />

                        <div className="space-y-2 pt-4">
                            {others.map((user) => (
                                <div key={user.id} className="flex items-center bg-card p-3 rounded-xl shadow-sm border">
                                    <p className="w-8 text-center text-muted-foreground font-bold">{user.rank}</p>
                                    <Avatar className="h-10 w-10 mr-3">
                                        <AvatarImage src={user.avatar_url || ''} alt={`Avatar de ${user.username}`} />
                                        <AvatarFallback>{user.username?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <p className="flex-1 font-semibold text-foreground truncate">{user.username}</p>
                                    <p className="font-bold text-primary">{user.xp} XP</p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {activeTab === "comunidade" && (
                <button className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95">
                    <Plus className="h-6 w-6" />
                </button>
            )}

            <BottomNavigation />
        </div>
    );
}
