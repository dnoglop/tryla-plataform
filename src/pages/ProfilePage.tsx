import React, { useState, useEffect } from "react";
import {
  Linkedin,
  Edit,
  Trophy,
  Star,
  BookCheck,
  Flame,
  ChevronRight,
  LogOut,
  BookHeart,
  Award,
  Sparkles,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile, updateUserStreak } from "@/services/profileService";
import { toast } from "sonner";
import { getModules, isModuleCompleted } from "@/services/moduleService";
import { getUserRanking, updateUserXpFromModules, RankingUser, RankingPeriod } from "@/services/rankingService";
import { cn } from "@/lib/utils";

// --- Subcomponentes (sem alterações aqui) ---

const StatsCard = ({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 text-center shadow-md shadow-slate-200/60">
    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
      <Icon className="h-5 w-5 text-orange-500" />
    </div>
    <p className="text-xl font-bold text-slate-800">{value}</p>
    <p className="text-xs font-medium text-slate-500">{label}</p>
  </div>
);

const DiaryCard = () => (
    <Link to="/diario" className="group block">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white shadow-xl shadow-orange-300/80 transition-transform duration-300 group-hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Meu Diário</h3>
                    <p className="mt-1 text-sm text-white/90">Anote e revise seus insights.</p>
                </div>
                <BookHeart className="h-10 w-10 text-white/70 transition-transform duration-300 group-hover:scale-110" />
            </div>
        </div>
    </Link>
);

const AchievementBadge = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex flex-shrink-0 flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-200 bg-white">
            <Icon className="h-8 w-8 text-amber-500" />
        </div>
        <p className="w-20 text-xs font-semibold text-slate-600">{label}</p>
    </div>
);


// --- Componente Principal ---

const ProfilePage = () => {
  const navigate = useNavigate();
  // ... (Toda a sua lógica de state e useEffect continua a mesma)
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedModulesCount, setCompletedModulesCount] = useState(0);
  const [userRank, setUserRank] = useState(0);

  useEffect(() => {
    const fetchUserProfileAndData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error("Usuário não autenticado.");
        const userId = session.user.id;

        await updateUserXpFromModules(userId);
        await updateUserStreak(userId);

        const [userProfile, modules, ranking] = await Promise.all([
          getProfile(userId),
          getModules(),
          getUserRanking("all")
        ]);
        
        if (userProfile) setProfile(userProfile);
        
        if (modules) {
          let completedCount = 0;
          for (const module of modules) {
            if (await isModuleCompleted(userId, module.id)) completedCount++;
          }
          setCompletedModulesCount(completedCount);
        }

        if (ranking) {
          const userPosition = ranking.findIndex((user) => user.id === userId);
          setUserRank(userPosition !== -1 ? userPosition + 1 : 0);
        }
      } catch (error: any) {
        toast.error("Não foi possível carregar seu perfil.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfileAndData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100">...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-32 bg-orange-500"></header>

      <main className="relative -mt-20 px-4 pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-4xl bg-slate-200">{profile?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            
            {/* 
              MUDANÇA APLICADA AQUI 
            */}
            {profile?.streak_days && profile.streak_days > 0 && (
                // O contêiner agora tem largura automática e padding horizontal
                <div className="absolute bottom-1 right-1 flex h-9 w-auto items-center justify-center gap-1 rounded-full bg-white px-2.5 shadow-md">
                    <Flame className="h-5 w-5 text-red-500" />
                    {/* O número agora está lado a lado, sem a classe 'absolute' */}
                    <span className="text-sm font-bold text-orange-600">
                        {profile.streak_days}
                    </span>
                </div>
            )}
            {/* 
              FIM DA MUDANÇA
            */}

          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">{profile?.full_name || "Usuário"}</h1>
          <p className="text-sm text-slate-500">@{profile?.username || "username"}</p>
        </div>

        <div className="mt-8 space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <StatsCard icon={Trophy} value={userRank > 0 ? `${userRank}º` : "N/A"} label="Ranking" />
                <StatsCard icon={Star} value={profile?.xp || 0} label="XP Total" />
                <StatsCard icon={BookCheck} value={completedModulesCount} label="Módulos" />
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-700">Sobre</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{profile?.bio || "Nenhuma biografia adicionada."}</p>
                {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="link" className="p-0 h-3 mt-4 text-blue-600">
                            <Linkedin className="h-4 w-4 mb-1" />
                            Acessar perfil
                        </Button>
                    </a>
                )}
            </div>

            <DiaryCard />

            <div>
              <h2 className="text-xl font-bold text-slate-800">Conquistas</h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
                <AchievementBadge icon={Sparkles} label="Primeiro Passo" />
                <AchievementBadge icon={Award} label="Mestre dos Módulos" />
                <AchievementBadge icon={Trophy} label="Top 10 do Ranking" />
              </div>
            </div>

            <div className="space-y-3 pt-4">
                <Link to="/editar-perfil" className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                        <Edit className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold text-slate-700">Editar Perfil</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 p-4 h-auto text-base font-semibold text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    Sair da conta
                </Button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;